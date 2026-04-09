<?php

namespace Hp;

//  PROJECT HONEY POT ADDRESS DISTRIBUTION SCRIPT
//  For more information visit: http://www.projecthoneypot.org/
//  Copyright (C) 2004-2026, Unspam Technologies, Inc.
//
//  This program is free software; you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation; either version 2 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program; if not, write to the Free Software
//  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA
//  02111-1307  USA
//
//  If you choose to modify or redistribute the software, you must
//  completely disconnect it from the Project Honey Pot Service, as
//  specified under the Terms of Service Use. These terms are available
//  here:
//
//  http://www.projecthoneypot.org/terms_of_service_use.php
//
//  The required modification to disconnect the software from the
//  Project Honey Pot Service is explained in the comments below. To find the
//  instructions, search for:  *** DISCONNECT INSTRUCTIONS ***
//
//  Generated On: Thu, 09 Apr 2026 09:57:40 -0400
//  For Domain: clickforcharity.net
//
//

//  *** DISCONNECT INSTRUCTIONS ***
//
//  You are free to modify or redistribute this software. However, if
//  you do so you must disconnect it from the Project Honey Pot Service.
//  To do this, you must delete the lines of code below located between the
//  *** START CUT HERE *** and *** FINISH CUT HERE *** comments. Under the
//  Terms of Service Use that you agreed to before downloading this software,
//  you may not recreate the deleted lines or modify this software to access
//  or otherwise connect to any Project Honey Pot server.
//
//  *** START CUT HERE ***

define('__REQUEST_HOST', 'hpr8.projecthoneypot.org');
define('__REQUEST_PORT', 80);
define('__REQUEST_SCRIPT', '/cgi/serve.php');

//  *** FINISH CUT HERE ***

interface Response
{
    public function getBody();
    public function getLines(): array;
}

class TextResponse implements Response
{
    private $content;

    public function __construct(string $content)
    {
        $this->content = $content;
    }

    public function getBody()
    {
        return $this->content;
    }

    public function getLines(): array
    {
        return explode("\n", $this->content);
    }
}

interface HttpClient
{
    public function request(string $method, string $url, array $headers = [], array $data = []): Response;
}

class ScriptClient implements HttpClient
{
    private $proxy;
    private $credentials;

    public function __construct(string $settings)
    {
        $this->readSettings($settings);
    }

    private function getAuthorityComponent(string $authority = null, string $tag = null)
    {
        if(is_null($authority)){
            return null;
        }
        if(!is_null($tag)){
            $authority .= ":$tag";
        }
        return $authority;
    }

    private function readSettings(string $file)
    {
        if(!is_file($file) || !is_readable($file)){
            return;
        }

        $stmts = file($file);

        $settings = array_reduce($stmts, function($c, $stmt){
            list($key, $val) = \array_pad(array_map('trim', explode(':', $stmt)), 2, null);
            $c[$key] = $val;
            return $c;
        }, []);

        $this->proxy       = $this->getAuthorityComponent($settings['proxy_host'], $settings['proxy_port']);
        $this->credentials = $this->getAuthorityComponent($settings['proxy_user'], $settings['proxy_pass']);
    }

    public function request(string $method, string $uri, array $headers = [], array $data = []): Response
    {
        $options = [
            'http' => [
                'method' => strtoupper($method),
                'header' => $headers + [$this->credentials ? 'Proxy-Authorization: Basic ' . base64_encode($this->credentials) : null],
                'proxy' => $this->proxy,
                'content' => http_build_query($data),
            ],
        ];

        $context = stream_context_create($options);
        $body = file_get_contents($uri, false, $context);

        if($body === false){
            trigger_error(
                "Unable to contact the Server. Are outbound connections disabled? " .
                "(If a proxy is required for outbound traffic, you may configure " .
                "the honey pot to use a proxy. For instructions, visit " .
                "http://www.projecthoneypot.org/settings_help.php)",
                E_USER_ERROR
            );
        }

        return new TextResponse($body);
    }
}

trait AliasingTrait
{
    private $aliases = [];

    public function searchAliases($search, array $aliases, array $collector = [], $parent = null): array
    {
        foreach($aliases as $alias => $value){
            if(is_array($value)){
                return $this->searchAliases($search, $value, $collector, $alias);
            }
            if($search === $value){
                $collector[] = $parent ?? $alias;
            }
        }

        return $collector;
    }

    public function getAliases($search): array
    {
        $aliases = $this->searchAliases($search, $this->aliases);
    
        return !empty($aliases) ? $aliases : [$search];
    }

    public function aliasMatch($alias, $key)
    {
        return $key === $alias;
    }

    public function setAlias($key, $alias)
    {
        $this->aliases[$alias] = $key;
    }

    public function setAliases(array $array)
    {
        array_walk($array, function($v, $k){
            $this->aliases[$k] = $v;
        });
    }
}

abstract class Data
{
    protected $key;
    protected $value;

    public function __construct($key, $value)
    {
        $this->key = $key;
        $this->value = $value;
    }

    public function key()
    {
        return $this->key;
    }

    public function value()
    {
        return $this->value;
    }
}

class DataCollection
{
    use AliasingTrait;

    private $data;

    public function __construct(Data ...$data)
    {
        $this->data = $data;
    }

    public function set(Data ...$data)
    {
        array_map(function(Data $data){
            $index = $this->getIndexByKey($data->key());
            if(is_null($index)){
                $this->data[] = $data;
            } else {
                $this->data[$index] = $data;
            }
        }, $data);
    }

    public function getByKey($key)
    {
        $key = $this->getIndexByKey($key);
        return !is_null($key) ? $this->data[$key] : null;
    }

    public function getValueByKey($key)
    {
        $data = $this->getByKey($key);
        return !is_null($data) ? $data->value() : null;
    }

    private function getIndexByKey($key)
    {
        $result = [];
        array_walk($this->data, function(Data $data, $index) use ($key, &$result){
            if($data->key() == $key){
                $result[] = $index;
            }
        });

        return !empty($result) ? reset($result) : null;
    }
}

interface Transcriber
{
    public function transcribe(array $data): DataCollection;
    public function canTranscribe($value): bool;
}

class StringData extends Data
{
    public function __construct($key, string $value)
    {
        parent::__construct($key, $value);
    }
}

class CompressedData extends Data
{
    public function __construct($key, string $value)
    {
        parent::__construct($key, $value);
    }

    public function value()
    {
        $url_decoded = base64_decode(str_replace(['-','_'],['+','/'],$this->value));
        if(substr(bin2hex($url_decoded), 0, 6) === '1f8b08'){
            return gzdecode($url_decoded);
        } else {
            return $this->value;
        }
    }
}

class FlagData extends Data
{
    private $data;

    public function setData($data)
    {
        $this->data = $data;
    }

    public function value()
    {
        return $this->value ? ($this->data ?? null) : null;
    }
}

class CallbackData extends Data
{
    private $arguments = [];

    public function __construct($key, callable $value)
    {
        parent::__construct($key, $value);
    }

    public function setArgument($pos, $param)
    {
        $this->arguments[$pos] = $param;
    }

    public function value()
    {
        ksort($this->arguments);
        return \call_user_func_array($this->value, $this->arguments);
    }
}

class DataFactory
{
    private $data;
    private $callbacks;

    private function setData(array $data, string $class, DataCollection $dc = null)
    {
        $dc = $dc ?? new DataCollection;
        array_walk($data, function($value, $key) use($dc, $class){
            $dc->set(new $class($key, $value));
        });
        return $dc;
    }

    public function setStaticData(array $data)
    {
        $this->data = $this->setData($data, StringData::class, $this->data);
    }

    public function setCompressedData(array $data)
    {
        $this->data = $this->setData($data, CompressedData::class, $this->data);
    }

    public function setCallbackData(array $data)
    {
        $this->callbacks = $this->setData($data, CallbackData::class, $this->callbacks);
    }

    public function fromSourceKey($sourceKey, $key, $value)
    {
        $keys = $this->data->getAliases($key);
        $key = reset($keys);
        $data = $this->data->getValueByKey($key);

        switch($sourceKey){
            case 'directives':
                $flag = new FlagData($key, $value);
                if(!is_null($data)){
                    $flag->setData($data);
                }
                return $flag;
            case 'email':
            case 'emailmethod':
                $callback = $this->callbacks->getByKey($key);
                if(!is_null($callback)){
                    $pos = array_search($sourceKey, ['email', 'emailmethod']);
                    $callback->setArgument($pos, $value);
                    $this->callbacks->set($callback);
                    return $callback;
                }
            default:
                return new StringData($key, $value);
        }
    }
}

class DataTranscriber implements Transcriber
{
    private $template;
    private $data;
    private $factory;

    private $transcribingMode = false;

    public function __construct(DataCollection $data, DataFactory $factory)
    {
        $this->data = $data;
        $this->factory = $factory;
    }

    public function canTranscribe($value): bool
    {
        if($value == '<BEGIN>'){
            $this->transcribingMode = true;
            return false;
        }

        if($value == '<END>'){
            $this->transcribingMode = false;
        }

        return $this->transcribingMode;
    }

    public function transcribe(array $body): DataCollection
    {
        $data = $this->collectData($this->data, $body);

        return $data;
    }

    public function collectData(DataCollection $collector, array $array, $parents = []): DataCollection
    {
        foreach($array as $key => $value){
            if($this->canTranscribe($value)){
                $value = $this->parse($key, $value, $parents);
                $parents[] = $key;
                if(is_array($value)){
                    $this->collectData($collector, $value, $parents);
                } else {
                    $data = $this->factory->fromSourceKey($parents[1], $key, $value);
                    if(!is_null($data->value())){
                        $collector->set($data);
                    }
                }
                array_pop($parents);
            }
        }
        return $collector;
    }

    public function parse($key, $value, $parents = [])
    {
        if(is_string($value)){
            if(key($parents) !== NULL){
                $keys = $this->data->getAliases($key);
                if(count($keys) > 1 || $keys[0] !== $key){
                    return \array_fill_keys($keys, $value);
                }
            }

            end($parents);
            if(key($parents) === NULL && false !== strpos($value, '=')){
                list($key, $value) = explode('=', $value, 2);
                return [$key => urldecode($value)];
            }

            if($key === 'directives'){
                return explode(',', $value);
            }

        }

        return $value;
    }
}

interface Template
{
    public function render(DataCollection $data): string;
}

class ArrayTemplate implements Template
{
    public $template;

    public function __construct(array $template = [])
    {
        $this->template = $template;
    }

    public function render(DataCollection $data): string
    {
        $output = array_reduce($this->template, function($output, $key) use($data){
            $output[] = $data->getValueByKey($key) ?? null;
            return $output;
        }, []);
        ksort($output);
        return implode("\n", array_filter($output));
    }
}

class Script
{
    private $client;
    private $transcriber;
    private $template;
    private $templateData;
    private $factory;

    public function __construct(HttpClient $client, Transcriber $transcriber, Template $template, DataCollection $templateData, DataFactory $factory)
    {
        $this->client = $client;
        $this->transcriber = $transcriber;
        $this->template = $template;
        $this->templateData = $templateData;
        $this->factory = $factory;
    }

    public static function run(string $host, int $port, string $script, string $settings = '')
    {
        $client = new ScriptClient($settings);

        $templateData = new DataCollection;
        $templateData->setAliases([
            'doctype'   => 0,
            'head1'     => 1,
            'robots'    => 8,
            'nocollect' => 9,
            'head2'     => 1,
            'top'       => 2,
            'legal'     => 3,
            'style'     => 5,
            'vanity'    => 6,
            'bottom'    => 7,
            'emailCallback' => ['email','emailmethod'],
        ]);

        $factory = new DataFactory;
        $factory->setStaticData([
            'doctype' => '<!DOCTYPE html>',
            'head1'   => '<html><head>',
            'head2'   => '<title>clickforcharity.net</title></head>',
            'top'     => '<body><div align="center">',
            'bottom'  => '</div></body></html>',
        ]);
        $factory->setCompressedData([
            'robots'    => 'H4sIAAAAAAAAA7PJTS1JVMhLzE21VSrKT8ovKVZSSM7PK0nNK7FVSsvPyckv18nLTyxKzsgsS1Wys8GnPC8_My8ltULJDgBGxg-KVQAAAA',
            'nocollect' => 'H4sIAAAAAAAAA7PJTS1JVMhLzE21VcrL103NTczM0U3Oz8lJTS7JzM9TUkjOzytJzSuxVdJXsgMAKsBXli0AAAA',
            'legal'     => 'H4sIAAAAAAAAA51a23LbOBJ936_AOlvepCpxnEwuzjKbKsVRYm9l7JSlTCqPEAmJGJMEFwCl0Xz9nu4GdclF9OxDIpkkQKAv55xu6HXUs8qo3FRVaHVum8W_j06P-O9WF0X_98z5wnj6-uZvr6On_woV4roy_z6auyY-muvaVut_qdo1jiYy2dGb42YW2ky9nr15jUtN_3zuKuf_de_9-_d4xr1-TPfevH4865__4cfBSdqfTvJ65tMV-jYtzc8n0WmSlTm-9-osC6___uiRyktvQ7Q0pHStWtnYmBBUZRY6Xys3n9vcqEeP3th4fO_J6RO8Fx9PM-9qel90au1w5cnLTIVuxjN6szSVjs6vVXBVYY3HrdZ4GNg2OhpVa_gjmrxs7H87nvx3k0cVaUIXSzwfjafXvMqCWril4T3eO3uZmVmwmGDzSp3nfNPTjl5mhYqlrLJWufbydd7JcNxfmCYG7AmPGWUb3kBp6hM1pUefZYYnpLmfwzq429D3J1nziD5fZF43QbYvU3uKLHruiyzshL7vOuSAR-MBjx4YZr4b9leD7-Dz8--e346a0MX9cJuww6OtTUoyV7eVzeFk5M7KmEjObU1udUVx8-RZMlyI3ubs7yt25WkGC798mnU11vWbDVbs7eiJ0FokZnj480XnadEzJ8MOPRvSs5ambr34d-F1HX4-pkxjCsMLO_0la9jruouu1pwXz7Nc0-dZVq03UTCuta0UMCZFYggptjhpL6OyAcmSu0Vj_5QnCp62co05gb3OXmWuQ0jeNmyIUgelhyGCXnGWcbxXyC4xr4v8zoCs1At510OlG3ZfaHHX5bkO1jVwVOtsEysCAZje29jhGhKn7ILVoSaPFo_Fbv4OgYe3LpNpsBrknvio5FcXNuTOFjSnCbRWLFrWmV5gGzF4P8oecFMfBkhGNqOM9MYIlGAL2HGhzB_7WfpDNL5LrughYN_PlbHOBWWGs6_VPq6VXmDtvJOFtgw8sEBvCJiy_0aP3D_6DxvU-YVubK7mwGCvStCdaQqNKJt7nTMkr5z31rDJu8IiM8U3apRHK0ZnWJSlJshP8bsAUZj0vVAjdlSXl6rSK0Sml2BylOwWcTJDGBeA2cIgfsjBSre8m6YYTk_Qxdz5ml13miH8mBvmw_E2T8szvt-YbtIkQd4Ow2Krjlfb6g5hNzOlXlpkRqVCDVmgCl3rBYQBLbtRM--6BaOd8Uuw4Yn6irTMXc8fErYz8FRymZBgZRkSMUW9H3B3iS17R9FwKOC-JpYctjb2IsBkBC1SqKUkVCXNVmsYrm2N9kqedbVZsUVnsOHJMHpuOPayQCrSyN-shMy6KSAnjOqa3PiIWFdtpSnUSFKE3NsW_sJFZIW3xcIEMqosQrC3R4uEruwF1fRW_-1ycjm9vpmo0Yeb8VhN6dqn0c30q7q-UZPx1bvLqw_s3s9vJ2Og7pPs8_iKV0Z6oTLgpGqtWtumiJiqtzfj0TlP_zgWd1OKB71d_r8sPYiFB7DpzXR88-uG07ehsyoToZXD4mXN_JSbIBKLo6WXYGruEiO61QbGWaw1ZEgeFhQEJDNx3IwLJmGc8TURHu5WMtH6QJTdphWNkN9XFM7PnmcXHWdeYZe2AIndB4Q-w7pWpbxzOPu8WGJRyoIkvH4-bJGGLTwjQkMq6PCLdjn7VWa3qAtDdluTgLPo2tOs95T8e_NpfA7Z9Es2-rgnBz_yxfPx1WS8d_1mz9m8NddADzdKq6UNe7nEjgonZMtHF0mWsSIuzB-kxpKcc1xJuEimfcaDCnIpnMsJVJlmEcu18DsGJZ2-uw28PYLWVdgUGNqbbTTGUsfhRAAKBxk97B3kM-9kVRlgiTpIR0UaoxeJ9swmHJ-k-qkN67x0EZwb1sAs6EF87arotboFDYoEDuxKign1eaL-8fxU4pJk8KwDuAnskjriG4UY12wwjqA5kCSEXxFWAp9UcfzzgB4yOxtmGcqJlqYOgXbxFOZuvSvtzMaduBpmjDsUs6NPnz5eno92Y25jhiisTK8PXYq7hxxyKMuIWhuTM-ZzyB09QG2qwcszhgbgiFuynWoZ2sgHrAnjg4XPtyHcVnLPUFgOqwdmjiQXmd0teByaKS0xISNFLN_VcSjo7CbBX5GY9yg_UWHz6PIOcS3KL6rS1sMPc1QHkrnIQFPBgl40Ci59U5n-1Gk3x_devMoIVV5lN-8mu_Ah4yGUAN7AfYkjdYlw9Lwd4wW4n2Qpo1vNqsnOkws81TtdwyrzFxQD1ZY0esHhFLSE1JQeO6chzRyawEJI2ZiXiYF7aLA94feruxhN1cUImzh7kY0n00vs4yz7wNi0I45GkrgeSdBh0aTp6A9bsO00lHOjfOnqGZUm0blYBpInePHV12Gs-JVNOMEafsG-XjzPPkBUPDvNJg94CRfqGqtCsk8vxvzMmLoPGIFVv3yZTf6arNhg--jq3R7Wn19D10wvr69-4MNA2UAe4nCvOdJJzpJV_oRadx3qUj0DJgTYP5oFK-PGRSpKUCEC57gKtJSigKVpz9y9IO7bIertWjK4oJxOzw-rivtRlDp1AiR2UjvAs16Isl7BTMR4JeSjtMjdWDovralhX20aSR14zVNbiEFItpP6QErIOWmBmFJerOX-WEMjgtakNIJdZ0aLdYZf3kri7OAuQhYh8TS7PJ9eyvyzYP7bWXJIsE1HzbO81PUMa22odAHeISNCy8mHl15zwO-5_M3765u79Yf6hfh_SmPQYc4VwiEReFAJS_NUJUCoHbJxXx7rxFU8aW2bglsLKEMLVHj0QbERTN4xdqNqsoHEvq0c25Gcvg2C0yyvusI83Mnm3OuEGCh1UW5aJmOMBMEfbBv1uFlqLy3GglQN4XTdEuCkoiJRznfCJb09QZ4EC3WqEASg1FZKmxwJBnnV4r0LJI93og_megky6OtD1hR3IINCCtlNNyl9smAaZuw9SaWMRuGeqA7ygO5KXTuXjPDIhQTxAuNbicUdLfgQdRjjOzeNxHBJqBv-i7JdmrOilG4bVGWmbksdgD2F7TwNBCEsdQXPN2Yh9E2xhrmpOSYvpA4Z81hxspMsbz_uq9uPoy97fxMico_JzG1jeebSUHOyUr-TICLD7z4vDRQGgmAXjbRIPt9cfl8h6Tz26nkTJK1PZb8AnaGmyBozwVhLIrAAnAW7YPuRs8nlpqc_CP_UytnMpr1Fvi_u0B9ISh6DaMWz9XCRuSkqxFeai_gmYlPqPoH30UjCrBa9HxPHzmRUXFFAM6_18otdo0YFclsxo0EXmRM2BznWVRqFvKmttwtp9Q0zwFcOrIb79DLxJOreXuBOUoj8grmnBheV5zq_Fa2dlONKFC3pcuOXPXL1Dcin2bfYe_1-uHTgToJoo73Qwa4JnojMv7kOM-3GT4MlfjruG-Eb4eMSimxU-oF87kvG-5tG4BE3VOyc_bVW3JFG-pUDmrfd1vBSdFBOp9MdhxBEIS0r7Rf_YQTJcnN5lfTUZHotZEX3ptfDTsXTz7IL1jrq8l1qsYAAbqnBYm9BbZ10fwoDiSNq3hG5ttp6alB3LV-RdiKLu9PscrzNy0Mu7BcxGYs6vDwfn_zlDg5esOvez_v1dXIx0uhok2Nf5KgtsUM0kitJQ2zOuADgyqbQ5jBf2n4E8fv9zb1mLVJbHU25O4JonoiK6JtrX2RqOYmrtQ9dS4cvAFTq7jO2EjpxPSUl2fFQK7-Pfj6aWwHJVL21-e46jvnkwebcLrTywnTY5r7Jtqvrq0cXn38dXX2bR_DMhMtcRNRO4qRm0UZb0jVUzmy5Zq-GqKwAF-mx8FBRJIv11srFRGSeAITLaLKSCblujSrcEqxTOJRNtkHEwU0l2JvoyrAMDnCG2ZYfc7-3KQBRZI3g12pbllIbK3XBDNulP3JiDwNlkaSQQarsdmy6IfqUkJLmX3pVingSWqUV6p0uURIvvPtuJ-6iBjzovokG5qUnDggjuyuMaNeLh2rBcWn_xHp5l4F7RsB2Wd837p28Iwl7ffV9eqSOfrLQAYbrlSl338tI1IbhMHrNYUBxN9SP6_fhtqYV40tMhpgW30u9OecvUY0ERutCXFSaTy9ds9JeDqqOHmxQcrj5IrV-M1wNTGQtJPH7WpTbY8cDPfxeHfYFkWgtr6GvAgAg1zNvRGE3gU7yQkuNAXxZaRTUvKHmQCeiV_FUd0nTg84_UodS6gS7tDLtLVYeSdWRri01dBASi7LI6bjNG15LKt5YQB7oM9tNEJBe7fXu1olsIYYGlGCafl-wUN8izX5dPHr7Q9T2pu8J5LpjkkEaQ8bPMTfSs4UgwxJRsQXmn6j9InX25AjXF6boqyZPv34g7KM6BkBbG654SlfRDy1yoPjCMIWdyBma8UcPhh1g51JRlHa-Y8wVwrgLomikdpWODITGcK_8k09niJwgKFxdsxHYVwBhOiOWgnR0NXnPxAm6lzv0zIG6so_K8-urCfM-6SaIpOl4ogD6vXv-AvnKiJR7VJbDO0nWke1ZwaQiE5DBIF-YKqbTZXIH9aWFQMV2tXRkG-MfbFC215hnWa8Yjx6cqE8VjLPTlJ5JRiFJUzdVzu1vwR9d6tbuQopR_W9RtpKfelvCjd_E6w3ryB8A5x261G06tYLgrvWaqA85sdT-lvo4lI0R11YlBMAcZmXDtNDO0fXrepFtWh90Ypqi46FayZF6ysADsNcvJQnauu2i2apI0TvDo3d6SLvWoV8i3OHoGMU3Ki75GYaWCq13Z6-qnA_SlegJgPQAtVp7QzzNLCVxKu4fbhePUjKgEu4d13Pv5ocKqRXVFI-lC7XRQDbsO3q3oORTdD70Z46DltrWCCSodkIvcUOeKN_NB2Jj50cRfQ8mdPO58QSV0oYgPRjXHiJB5ZXxtypAG7pVOmTlgl-sRb8Cof6GlNWA5GLeVWqp83xPGCVu3zlIusP6fk9tBxsQp33ngJt9_Wn6gkwJMUbVpdKLhU-Slot7wmT-QVku1UEvh5em6TbampcSRDtI9dhxZ7nSf65TwynpQkZ26Sq5FTJ17qpbEKavu1YV0Ibr7W7FA_yTgmZIkPSigJsMPwqHRhlBJbEh14PH358FsSKO0Ce0VnlUs5rH2_ruzMn3YcZAfK1GanpxefOO7w3SDpew5-fUqj7NpqOr8zHwGxfPtpJPQPwx_2byMf8ODF9w43-hXRIGeSkAAA',
            'style'     => 'H4sIAAAAAAAAAyXMywmAMAwA0FUEr9bPtRWP3SPWiIWQlDSIIu7uwTfAm6vdhAv0iXBVLIecTxIS9W2MMezC5lehrZnGcjWgGairwNVV1LwHw8vchkkULAt7FsbwzsO_fgNk0KxdAAAA',
            'vanity'    => 'H4sIAAAAAAAAA22S207DMAyGX8XKbmEdp0nL2goxDSEk2MThgsu0ydpAiCPHtOztScu4ARRZspX4-38nyVlVzkBtnItB1dY3hZiJoQxK60NZIWlDQxZ570whKlW_NYQfXsvJYrFY9lZzK0_PZuFzKcqcKYWGTjnb-EIwhp_GA1TCSfiE0xQXKc5T17fEMdmmZRnRWT0emaxWq4GYvHk4MHboWVboNAx6oMgqdxSVj8fRkN0ta3RIcjKfz5dJWQ6eAkbLFr0k4xTbziTmZZ4N1DLPWP-xC4fcmR0L-GX-LKnO0jr_nlZBS2ZXiJY5yCzr-34aCF9NzS16sw_IU6QmE1A7FWMhamcqMqHFTpR367ur9QNsrmH7sLldr57gZnO_foHt5inPVJlX9C__wyfr79Ma38U_0Me0BzeKOhPZEGwJOZlJ48O94R7pbcAmi53VRkO1h-cRNwqOl5END5iNP6P8AoVe2PEhAgAA',
        ]);
        $factory->setCallbackData([
            'emailCallback' => function($email, $style = null){
                $value = $email;
                $display = 'style="display:' . ['none',' none'][random_int(0,1)] . '"';
                $style = $style ?? random_int(0,5);
                $props[] = "href=\"mailto:$email\"";
        
                $wrap = function($value, $style) use($display){
                    switch($style){
                        case 2: return "<!-- $value -->";
                        case 4: return "<span $display>$value</span>";
                        case 5:
                            $id = 's6sputr34';
                            return "<div id=\"$id\">$value</div>\n<script>document.getElementById('$id').innerHTML = '';</script>";
                        default: return $value;
                    }
                };
        
                switch($style){
                    case 0: $value = ''; break;
                    case 3: $value = $wrap($email, 2); break;
                    case 1: $props[] = $display; break;
                }
        
                $props = implode(' ', $props);
                $link = "<a $props>$value</a>";
        
                return $wrap($link, $style);
            }
        ]);

        $transcriber = new DataTranscriber($templateData, $factory);

        $template = new ArrayTemplate([
            'doctype',
            'injDocType',
            'head1',
            'injHead1HTMLMsg',
            'robots',
            'injRobotHTMLMsg',
            'nocollect',
            'injNoCollectHTMLMsg',
            'head2',
            'injHead2HTMLMsg',
            'top',
            'injTopHTMLMsg',
            'actMsg',
            'errMsg',
            'customMsg',
            'legal',
            'injLegalHTMLMsg',
            'altLegalMsg',
            'emailCallback',
            'injEmailHTMLMsg',
            'style',
            'injStyleHTMLMsg',
            'vanity',
            'injVanityHTMLMsg',
            'altVanityMsg',
            'bottom',
            'injBottomHTMLMsg',
        ]);

        $hp = new Script($client, $transcriber, $template, $templateData, $factory);
        $hp->handle($host, $port, $script);
    }

    public function appendVisitPayload(array &$data, $type, array $values)
    {
        $count = count($values);
        if ($count === 0) {
            return;
        }

        $data["has_$type"] = $count;
        foreach ($values as $key => $value) {
            $data["$type|$key"] = $value;
        }
    }

    public function handle($host, $port, $script)
    {
        $data = [
            'tag1' => 'e4eafa2465aff48ee87441f4eba7ff75',
            'tag2' => '8f1538bb7c8ebf7f9d45982fecf8896d',
            'tag3' => '2777ab7079ed6c18fc916bf33e1ff18c',
            'tag4' => md5_file(__FILE__),
            'version' => "php-".phpversion(),
            'ip'      => $_SERVER['REMOTE_ADDR'],
            'svrn'    => $_SERVER['SERVER_NAME'],
            'svp'     => $_SERVER['SERVER_PORT'],
            'sn'      => $_SERVER['SCRIPT_NAME']     ?? '',
            'svip'    => $_SERVER['SERVER_ADDR']     ?? '',
            'rquri'   => $_SERVER['REQUEST_URI']     ?? '',
            'phpself' => $_SERVER['PHP_SELF']        ?? '',
            'ref'     => $_SERVER['HTTP_REFERER']    ?? '',
            'uagnt'   => $_SERVER['HTTP_USER_AGENT'] ?? '',
        ];

        if (isset($_POST)) {
            $this->appendVisitPayload($data, 'post', $_POST);
        }

        if (isset($_GET)) {
            $this->appendVisitPayload($data, 'get', $_GET);
        }

        if (isset($_SERVER)) {
            $headers = [];
            foreach ($_SERVER as $key => $value) {
                if (strpos($key, 'HTTP_') === 0) {
                    $header = strtolower(str_replace('_', '-', substr($key, 5)));
                    $headers[$header] = $value;
                }
            }

            $this->appendVisitPayload($data, 'header', $headers);
        }

        $headers = [
            "User-Agent: PHPot {$data['tag2']}",
            "Content-Type: application/x-www-form-urlencoded",
            "Cache-Control: no-store, no-cache",
            "Accept: */*",
            "Pragma: no-cache",
        ];

        $subResponse = $this->client->request("POST", "http://$host:$port/$script", $headers, $data);
        $data = $this->transcriber->transcribe($subResponse->getLines());
        $response = new TextResponse($this->template->render($data));

        $this->serve($response);
    }

    public function serve(Response $response)
    {
        header("Cache-Control: no-store, no-cache");
        header("Pragma: no-cache");

        print $response->getBody();
    }
}

Script::run(__REQUEST_HOST, __REQUEST_PORT, __REQUEST_SCRIPT, __DIR__ . '/phpot_settings.php');

