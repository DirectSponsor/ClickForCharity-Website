var coinzilla_display = (function() {
    var coinzilla_display = {
        push: function(args){
            if(typeof args.zone === 'undefined') {
                return;
            }
            if(typeof args.width === 'undefined') {
                args.width = 300;
            }
            if(typeof args.height === 'undefined') {
                args.height = 250;
            }
            if(!util.isCookieEnabled()) return;
            var nounce = Math.floor(Math.random()*1000000000000) + new Date().getTime();
            if(mobile.true){
                if(parseInt(args.width) === 728 && parseInt(args.height) === 90){
                    args.width = 320;
                    args.height = 100;
                }
            }
            const _wallets = [
                'ethereum',
                'web3',
                'cardano',
                'BinanceChain',
                'solana',
                'tron',
                'tronLink',
                'tronWeb',
                'tronLink',
                'starknet_argentX',
                'walletLinkExtension',
                'coinbaseWalletExtension',
                '__venom',
                'martian',
                'razor',
                'razorWallet',
                'ic', // plug wallet,
                'cosmos',
                'ronin',
                'starknet_braavos',
                'XverseProviders',
                'compass',
                'solflare',
                'solflareWalletStandardInitialized',
                'sender',
                'rainbow'
            ];
            args.wd = _wallets.some(prop => typeof window[prop] !== 'undefined') ? 1 : 0;
            var urlCheck = 'https://request-global.czilladx.com/serve/get.php?withoutAdCode=1&z='+args.zone+'&w='+args.width+'&h='+args.height+'&wd='+args.wd+'&n='+nounce;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', urlCheck,true);
            xhr.withCredentials = true;
            xhr.onload = function() {
                if (xhr.status === 200) {
                    var response = xhr.responseText;
                    if(util.isEmptyString(response)) return;
                    args.url = response;
                    load[args.zone] = function (args) {
                        return new this(args);
                    };
                    load[args.zone](args);
                }
            };
            xhr.send();
        }
    };
    var fullAgent = navigator.userAgent,
        userAgent = navigator.userAgent.toLowerCase(),
        mobile = {
            true: /iphone|ipad|android|ucbrowser|iemobile|ipod|blackberry|bada/.test(userAgent)
        },
        util = {
            bind: function(fn,action,target){
                if (target.addEventListener) {
                    target.addEventListener(action, fn);
                } else if (target.attachEvent) {
                    target.attachEvent("on"+action, fn);
                }
            },
            getCookie: function(name) {
                var cookieMatch = document.cookie.match(new RegExp(name + '=([^;]+)'));
                if(cookieMatch) {
                    return decodeURIComponent(cookieMatch[1]);
                }else return null;
            },
            setCookie: function(name, value, minutes, path) {
                if (minutes === null || typeof minutes == 'undefined') {
                    minutes = null;
                } else {
                    var date;
                    if (typeof minutes == 'number') {
                        date = new Date();
                        date.setTime(date.getTime() + minutes * 60 * 1e3);
                    } else {
                        date = minutes;
                    }
                    minutes = '; expires=' + date.toUTCString();
                }
                document.cookie = name + '=' + encodeURIComponent(value) + minutes + '; path=' + (path || '/');
            },
            isCookieEnabled: function(){
                return navigator.cookieEnabled;
            },
            isEmptyString : function (string) {
                return (
                    (typeof string == 'undefined')
                    ||
                    (string == null)
                    ||
                    (string == false)  //same as: !x
                    ||
                    (string.length == 0)
                    ||
                    (string == "")
                    ||
                    (string.replace(/\s/g,"") == "")
                    ||
                    (!/[^\s]/.test(string))
                    ||
                    (/^\s*$/.test(string))
                );
            }
        },
        load = function (needle) {
            this.construct(needle)
        };
    load.prototype = {
        construct: function(args){
            var src = args.url;
            var placeholder = document.getElementsByClassName("coinzilla");
            for (var i = 0; i < placeholder.length; i++) {
                if(typeof placeholder[i].dataset.rendered !== "undefined"){
                    continue;
                }
                if(typeof placeholder[i].dataset.zone === "undefined"){
                    continue;
                }
                if(placeholder[i].dataset.zone !== "C-"+args.zone){
                    continue;
                }
                placeholder[i].setAttribute("style","max-width: "+args.width+"px; width:"+args.width+"px; height:"+args.height+"px; display: inline-block;");
                placeholder[i].setAttribute("data-rendered","true");
                var ifrm = document.createElement("iframe");
                ifrm.setAttribute("src", src);
                ifrm.setAttribute("scrolling", "no");
                ifrm.setAttribute("style","border: 0; overflow: hidden; margin:0 auto;width: 100%;max-width: "+args.width+";height: 100%;max-height: "+args.height+";");
                ifrm.setAttribute('frameborder', '0');
                ifrm.setAttribute('scrolling',"no");
                ifrm.setAttribute('allowtransparency', 'true');
                //ifrm.setAttribute('sandbox', 'allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation');
                ifrm.id = 'Z-'+args.zone;
                placeholder[i].appendChild(ifrm);
            }
        }
    };
    if(typeof window.coinzilla_display !== "undefined"){
        for(var i=0; i<window.coinzilla_display.length;i++){
            coinzilla_display.push(window.coinzilla_display[i]);
        }
    }
    return coinzilla_display;
})();