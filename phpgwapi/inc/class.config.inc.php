<?php
/**
 * eGW's application configuration in a centralized location
 *
 * @link www.egroupware.org
 * @author Joseph Engo <jengo@phpgroupware.org> original class Copyright (C) 2000, 2001 Joseph Engo
 * @author Ralf Becker <ralfbecker@outdoor-training.de>
 * @version $Id$
 */

/**
 * eGW's application configuration in a centralized location
 */
class config
{
	/**
	 * Name of the config table
	 *
	 */
	const TABLE = 'egw_config';
	/**
	 * Reference to the global db class
	 *
	 * @var egw_db
	 */
	static private $db;
	/**
	 * Cache for the config data shared by all instances of this class
	 *
	 * @var array
	 */
	static private $configs = array();

	/**
	 * app the particular config class is instanciated for
	 *
	 * @var string
	 */
	private $appname;
	/**
	 * actual config-data of the instanciated class
	 *
	 * @deprecated dont use direct
	 * @var array
	 */
	public $config_data;

	/**
	 * Constructor for the old non-static use
	 *
	 * @param string $appname
	 */
	function __construct($appname = '')
	{
		if (!$appname)
		{
			$appname = $GLOBALS['egw_info']['flags']['currentapp'];
		}
		$this->appname = $appname;
	}

	/**
	 * reads the whole repository for $this->appname, appname has to be set via the constructor
	 *
	 * You can also use the static config::read($app) method, without instanciating the class.
	 *
	 * @return array the whole config-array for that app
	 */
	function read_repository()
	{
		$this->config_data = self::read($this->appname);

		//echo __CLASS__.'::'.__METHOD__."() this->appname=$this->appname\n"; _debug_array($this->config_data);

		return $this->config_data;
	}

	/**
	 * updates the whole repository for $this->appname, you have to call read_repository() before (!)
	 */
	function save_repository()
	{
		if (!is_object(self::$db))
		{
			self::init_db();
		}
		if (is_array($this->config_data))
		{
			self::$db->lock(array(config::TABLE));
			foreach($this->config_data as $name => $value)
			{
				self::save_value($name, $value, $this->appname, false);
			}
			foreach(self::$configs[$this->appname] as $name => $value)
			{
				if (!isset($this->config_data[$name]))	// has been deleted
				{
					self::save_value($name, null, $this->appname, false);
				}
			}
			self::$db->unlock();

			if ($this->appname == 'phpgwapi' && method_exists($GLOBALS['egw'],'invalidate_session_cache'))	// egw object in setup is limited
			{
				$GLOBALS['egw']->invalidate_session_cache();	// in case egw_info is cached in the session (phpgwapi is in egw_info[server])
			}
			self::$configs[$this->appname] = $this->config_data;
		}
	}

	/**
	 * updates or insert a single config-value direct into the database
	 *
	 * Can (under recent PHP version) only be used static!
	 * Use $this->value() or $this->delete_value() together with $this->save_repository() for non-static usage.
	 *
	 * @param string $name name of the config-value
	 * @param mixed $value content, empty or null values are not saved, but deleted
	 * @param string $app app-name (depreacted to use default of $this->appname set via the constructor!)
	 * @param boolean $update_cache=true update instance cache and for phpgwapi invalidate session-cache
	 * @throws egw_exception_wrong_parameter if no $app parameter given for static call
	 * @return boolean|int true if no change, else number of affected rows
	 */
	static function save_value($name, $value, $app, $update_cache=true)
	{
		if (!$app && (!isset($this) || !is_a($this,__CLASS__)))
		{
			throw new egw_exception_wrong_parameter('$app parameter required for static call of config::save_value($name,$value,$app)!');
		}
		//echo "<p>config::save_value('$name','".print_r($value,True)."','$app')</p>\n";
		if (!$app || isset($this) && is_a($this,__CLASS__) && $app == $this->appname)
		{
			$app = $this->appname;
			$this->config_data[$name] = $value;
		}
		//echo "<p>config::save_value('$name','".print_r($value,True)."','$app')</p>\n";
		if (isset(self::$configs[$app][$name]) && self::$configs[$app][$name] === $value)
		{
			return True;	// no change ==> exit
		}

		if (isset(self::$configs[$app]))
		{
			self::$configs[$app][$name] = $value;
		}
		if(is_array($value))
		{
			$value = serialize($value);
		}
		if (!is_object(self::$db))
		{
			self::init_db();
		}
		if (!isset($value) || $value === '')
		{
			if (isset(self::$configs[$app])) unset(self::$configs[$app][$name]);
			self::$db->delete(config::TABLE,array('config_app'=>$app,'config_name'=>$name),__LINE__,__FILE__);
		}
		else
		{
			self::$configs[$app][$name] = $value;
			if(is_array($value)) $value = serialize($value);
			self::$db->insert(config::TABLE,array('config_value'=>$value),array('config_app'=>$app,'config_name'=>$name),__LINE__,__FILE__);
		}
		if ($update_cache)
		{
			if ($app == 'phpgwapi' && method_exists($GLOBALS['egw'],'invalidate_session_cache'))	// egw object in setup is limited
			{
				$GLOBALS['egw']->invalidate_session_cache();	// in case egw_info is cached in the session (phpgwapi is in egw_info[server])
			}
			egw_cache::setInstance(__CLASS__, 'configs', self::$configs);
		}
		return self::$db->affected_rows();
	}

	/**
	 * deletes the whole repository for $this->appname, appname has to be set via the constructor
	 *
	 */
	function delete_repository()
	{
		if (!is_object(self::$db))
		{
			self::init_db();
		}
		self::$db->delete(config::TABLE,array('config_app' => $this->appname),__LINE__,__FILE__);

		unset(self::$configs[$this->appname]);
	}

	/**
	 * deletes a single value from the repository, you need to call save_repository after
	 *
	 * @param $variable_name string name of the config
	 */
	function delete_value($variable_name)
	{
		unset($this->config_data[$variable_name]);
	}

	/**
	 * sets a single value in the repositry, you need to call save_repository after
	 *
	 * @param $variable_name string name of the config
	 * @param $variable_data mixed the content
	 */
	function value($variable_name,$variable_data)
	{
		$this->config_data[$variable_name] = $variable_data;
	}

	/**
	 * Reads the configuration for an applications
	 *
	 * Does some caching to not read it twice (in the same request)
	 *
	 * @param string $app
	 * @return array
	 */
	static function read($app)
	{
		$config =& self::$configs[$app];

		if (!isset($config))
		{
			if (!is_object(self::$db))
			{
				self::init_db();
			}
			$config = array();
			foreach(self::$db->select(config::TABLE,'*',array('config_app' => $app),__LINE__,__FILE__) as $row)
			{
				$name = $row['config_name'];
				$value = $row['config_value'];

				$test = @unserialize($value);
				if($test === false)
				{
					// manually retrieve the string lengths of the serialized array if unserialize failed
					$test = @unserialize(preg_replace('!s:(\d+):"(.*?)";!se', "'s:'.mb_strlen('$2','8bit').':\"$2\";'", $value));
				}

				$config[$name] = is_array($test) ? $test : $value;
			}
		}
		return $config;
	}

	/**
	 * get customfield array of an application
	 *
	 * @param string $app
	 * @param boolean $all_private_too=false should all the private fields be returned too, default no
	 * @param string $only_type2=null if given only return fields of type2 == $only_type2
	 * @return array with customfields
	 */
	static function get_customfields($app,$all_private_too=false, $only_type2=null)
	{
		$config = self::read($app);
		$config_name = isset($config['customfields']) ? 'customfields' : 'custom_fields';

		$cfs = is_array($config[$config_name]) ? $config[$config_name] : array();

		foreach($cfs as $name => $field)
		{
			if (!$all_private_too && $field['private'] && !self::_check_private_cf($field['private']) ||
				$only_type2 && $field['type2'] && !in_array($only_type2, explode(',', $field['type2'])))
			{
				unset($cfs[$name]);
			}
		}
		//error_log(__METHOD__."('$app', $all_private_too, '$only_type2') returning fields: ".implode(', ', array_keys($cfs)));
		return $cfs;
	}

	/**
	 * Check if user is allowed to see a certain private cf
	 *
	 * @param string $private comma-separated list of user- or group-id's
	 * @return boolean true if user has access, false otherwise
	 */
	private static function _check_private_cf($private)
	{
		static $user_and_memberships;

		if (!$private)
		{
			return true;
		}
		if (is_null($user_and_memberships))
		{
			$user_and_memberships = $GLOBALS['egw']->accounts->memberships($GLOBALS['egw_info']['user']['account_id'],true);
			$user_and_memberships[] = $GLOBALS['egw_info']['user']['account_id'];
		}
		if (!is_array($private)) $private = explode(',',$private);

		return (boolean) array_intersect($private,$user_and_memberships);
	}


	/**
	 * Change account_id's of private custom-fields
	 *
	 * @param string $app
	 * @param array $ids2change from-id => to-id pairs
	 * @return int number of changed ids
	 */
	static function change_account_ids($app, array $ids2change)
	{
		$changed = 0;
		if (($cfs = self::get_customfields($app, true)))
		{
			foreach($cfs as $name => &$data)
			{
				if ($data['private'])
				{
					foreach($data['private'] as &$id)
					{
						if (isset($ids2change[$id]))
						{
							$id = $ids2change[$id];
							++$changed;
						}
					}
				}
			}
			if ($changed)
			{
				self::save_value('customfields', $cfs, $app);
			}
		}
		return $changed;
	}

	/**
	 * Return names of custom fields containing account-ids
	 *
	 * @param string $app
	 * @return array account[-commasep] => array of name(s) pairs
	 */
	static function get_account_cfs($app)
	{
		$types = array();
		if (($cfs = self::get_customfields($app, true)))
		{
			foreach($cfs as $name => $data)
			{
				if ($data['type'] == 'select-account' || $data['type'] == 'home-accounts')
				{
					$types['account'.($data['rows'] > 1 ? '-commasep' : '')][] = $name;
				}
			}
		}
		return $types;
	}

	/**
	 * get_content_types of using application
	 *
	 * @param string $app
	 * @return array with content-types
	 */
	static function get_content_types($app)
	{
		$config = self::read($app);

		return is_array($config['types']) ? $config['types'] : array();
	}

	/**
	 * Initialise our db
	 *
	 * We use a reference here (no clone), as we no longer use egw_db::row() or egw_db::next_record()!
	 *
	 */
	private static function init_db()
	{
		if (is_object($GLOBALS['egw']->db))
		{
			config::$db = $GLOBALS['egw']->db;
		}
		else
		{
			config::$db = $GLOBALS['egw_setup']->db;
		}
	}
}
