class TelemetryMetrics {
    constructor(telemetrySessionId, telemetryApi, partnerId) {
        this.telemetrySessionId = telemetrySessionId;
        this.telemetryApi = telemetryApi;
        this.partnerId = partnerId;
        this.partnerData = {};
        this.launchResponseReceived = false;
    }

    static create(telemetryApi, partnerId) {
        return new TelemetryMetrics(
            this.getUniqueId(),
            telemetryApi,
            partnerId
        );
    }

    static createWithId(
        telemetrySessionId,
        telemetryApi,
        partnerId
    ) {
        return new TelemetryMetrics(
            telemetrySessionId,
            telemetryApi,
            partnerId
        );
    }

    // Whenever the script is downloaded on a page, send a script-downloaded event
    trackScriptDownloaded(eventName = 'script-downloaded') {
        this.trackEvent(eventName, null, null, {
            sinceLaunch: 0,
        });
    }

    // Whenever flow container constructor is called with parameters of partner data passed, send a partner-data-passed event
    trackPartnerDataPassed(params,) {
        this.partnerData = params;
        this.trackEvent('partner-data-passed', null, null);
    }

    // Whenever an ad unit is launched, send a unit-launched event
    trackUnitLaunched(configId, sourceId, launchMethod) {
        this.trackEvent('unit-launched', configId, sourceId, {
            sinceLaunch: 0,
            launchMethod: launchMethod
        });
    }

    // Whenever an ad unit responded with offers, send a unit-displayed event
    trackUnitDisplayed(configId, sourceId, offersAvailable) {
        this.launchResponseReceived = true;
        this.trackEvent('unit-displayed', configId, sourceId, {
            offersAvailable,
        });
    }

    // Whenever an ad unit responded with no offers, send a unit-no-offers event
    trackUnitNoOffers(configId, sourceId) {
        this.launchResponseReceived = true;
        this.trackEvent('unit-no-offers', configId, sourceId, {
            offersAvailable: 0,
        });
    }

    // Whenever an ad unit does not respond in time, send a unit-timeout event
    trackUnitTimeout(configId, sourceId) {
        if (this.launchResponseReceived) return;
        this.trackEvent('unit-timeout', configId, sourceId);
    }

    // Get the performance mark name for an event
    getPerformanceMarkName(eventName) {
        return `${eventName}_${this.telemetrySessionId}`;
    }

    // Send a telemetry event
    trackEvent(eventName, configId, sourceId, eventData = {}) {
        let sinceLaunch = 0;
        if (performance) {
            performance.mark(this.getPerformanceMarkName(eventName));
            try {
                const launchMarkName = this.getPerformanceMarkName('unit-launched');
                const hasLaunchMark = performance.getEntriesByName(launchMarkName, 'mark').length > 0;
                if (hasLaunchMark) {
                    sinceLaunch = performance.measure(
                        'since-launch',
                        this.getPerformanceMarkName('unit-launched')
                    ).duration;
                }
            } catch (error) {
                console.debug('Failed to measure since launch:', error);
            }
        }

        const payload = {
            telemetrySessionId: this.telemetrySessionId,
            event: {
                eventName,
                origin: window.location.origin,
                path: window.location.pathname,
                partnerData: this.partnerData,
                partnerId: this.partnerId,
                configId: configId,
                sourceId: sourceId,
                timestamp: new Date().toISOString(),
                timeOnPage: performance.now(),
                timeSinceLaunch: sinceLaunch,
                tabHasFocus: document.hasFocus(),
                useragent: navigator.userAgent,
                maxTouchPoints: navigator.maxTouchPoints,
                ...eventData,
            },
        };

        const jsonPayload = JSON.stringify(payload);

        try {
            const success = navigator.sendBeacon(this.telemetryApi, jsonPayload);
            if (success) {
                console.debug('Telemetry event sent successfully:', payload);
            } else {
                console.error('Failed to send telemetry event:', payload);
            }
        } catch (error) {
            console.error('Error sending telemetry event:', error);
        }
    }

    // Generate a unique identifier
    static getUniqueId() {
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            // browser
            return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                (
                    c ^
                    (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
                ).toString(16)
            );
        } else {
            let str = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
            return str.replace(/[xy]/g, function (c) {
                let r = (Math.random() * 16) | 0,
                    v = c == 'x' ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            });
        }
    }
}
if (performance) {
    performance.mark('fc-available');
}


// Initialize telemetry metrics and track script downloaded event
const metrics = TelemetryMetrics.create(
    'https://telemetry.partners.prod.minionplatform.com/collect',
    '52ad036a-817d-4866-aa96-50bb0b391bdc'
);
metrics.trackScriptDownloaded();

const ConfigType = {
    EMBED: 'embed',
    OVERLAY: 'overlay'
};


//Order details location id
const DEFAULT_LOCATION_ID = "f9817a0b-597a-41cb-9877-5a3488934cbe";

class FlowContainer {
    static showMethodCalled = false;
    configs = [];

    constructor({params = {}, themeOverride = null}) {
        this.params = params;
        this.params['partnerDomain'] = this.getPartnerDomain();
        this.params['telemetrySessionId'] = metrics.telemetrySessionId;
        // UTC to local time offset in hours
        this.params['localTimeOffset'] = new Date().getTimezoneOffset() / 60;

        if (navigator) {
            this.params['maxTouchPoints'] = navigator.maxTouchPoints;
        }

        if (themeOverride) {
            this.params.themeOverride = btoa(JSON.stringify(themeOverride));
        }


        let overlayConfigs = JSON.parse("[\n  {\n    \u0022id\u0022: \u0022ff07d2c2-2a57-4e02-9db1-33fda584516c\u0022,\n    \u0022url\u0022: \u0022https://public.prod.minionplatform.com/v1/display?sourceid=208240\\u0026subaff2=208240\\u0026implementationtype=pageoverlay\\u0026configid=ff07d2c2-2a57-4e02-9db1-33fda584516c\\u0026placementlocationid=f9817a0b-597a-41cb-9877-5a3488934cbe\\u0026placementexperienceid=b7e2e2c1-8e2a-4e2d-9b1a-2c3e4f5a6b7c\u0022,\n    \u0022sourceId\u0022: \u0022208240\u0022,\n    \u0022locationId\u0022: \u0022f9817a0b-597a-41cb-9877-5a3488934cbe\u0022\n  }\n]");
        for (let config of overlayConfigs) {
            this.configs.push({
                frame: null,
                type: ConfigType.OVERLAY,
                id: config.id,
                locationId: config.locationId,
                url: config.url,
                sourceId: config.sourceId,
                launched: false
            });
        }

        let embeddedConfigs = JSON.parse("[]");
        for (let config of embeddedConfigs) {
            this.configs.push({
                frame: null,
                type: ConfigType.EMBED,
                id: config.id,
                locationId: config.locationId,
                url: config.url,
                sourceId: config.sourceId,
                launched: false
            });
        }


        this.addMessageEventListener();
        // Execute page embedded placements immediately
        // Track params passed to the partner event
        metrics.trackPartnerDataPassed(params);

        for (var config of this.configs.filter(f => f.type === ConfigType.EMBED)) {
            this.renderEmbeddedConfig(config);
        }
    }


    registerTimeout(metrics, config) {
        setTimeout(() => {
            if (config.launched) return;
            metrics.trackUnitTimeout(config.id, config.sourceId);
            if (config.type === ConfigType.OVERLAY) {
                this.closeEmbedOverlayFlow(config.frame);
            }
        }, 10000);
    }


    renderEmbeddedConfig(config) {
        if (!config) return;
        if (config.launched) {
            console.warn("this config has already been launched before", config)
            return;
        }

        let placementElement;
        let launchMethod = null;
        const
            tryGetPlacementElement = (element, method) => {
                if (!element) return null;
                //make sure this div is not used by another config
                let matchingConfig = this.configs.find(x => x.frame === element)
                if (matchingConfig) {
                    console.debug("div already in use by another config", method, element, matchingConfig);
                    return null;
                }
                launchMethod = method;
                return element;
            };

        //we want to look for a container for this config on the page but there could be multiple candidates.
        // the priority will be first try and find a div with this specific config id;
        //then we look for one with the current location id
        //and after that if this is using the default location id we can look for the legacy container
        placementElement = tryGetPlacementElement(document.querySelector('[data-af-config-id="' + config.id + '"]'), "embed-config-id");
        placementElement ??= tryGetPlacementElement(document.querySelector('[data-af-location-id="' + config.locationId + '"]'), "embed-location-id");
        if (config.locationId === DEFAULT_LOCATION_ID)
            placementElement ??= tryGetPlacementElement(document.getElementById('af-placement'), "embed-legacy");

        if (placementElement != null) {
            if (!config) return;
            placementElement.innerHTML = this.embedPageTemplate(config);
            config.frame = placementElement;
            metrics.trackUnitLaunched(config.id, config.sourceId, launchMethod);
            this.registerTimeout(metrics, ConfigType.EMBED, config, placementElement);
        } else if (
            document.readyState !== 'complete' ||
            document.readyState !== 'interactive'
        ) {
            window.addEventListener('DOMContentLoaded', () => {
                this.renderEmbeddedConfig(config);
            });
        }
    }

    renderOverlayConfig(config, launchMethod) {
        if (!config) return;
        if (config.launched) {
            console.warn("this config has already been launched before", config)
            return;
        }
        const overlayElem = document.createElement('div');
        overlayElem.classList.add('fluent-af-exp-modal');
        overlayElem.classList.add('embedflow-hidden');
        overlayElem.innerHTML = this.embedOverlayTemplate(config);
        overlayElem.classList.add('fluent-af-exp-modal--open');

        config.frame = overlayElem;
        config.launched = true;
        document.body.appendChild(overlayElem);
        // Update metrics for this config
        metrics.trackUnitLaunched(config.id, config.sourceId, launchMethod);
        this.registerTimeout(metrics, ConfigType.OVERLAY, overlayElem);
    }


    show() {
        if (FlowContainer.showMethodCalled) {
            console.warn('The show method can only be called once');
            return;
        }
        FlowContainer.showMethodCalled = true;
        //if they are still using the legacy show() call we should only ever show the default location id
        let config = this.configs.find(config => config.type === ConfigType.OVERLAY && config.locationId === DEFAULT_LOCATION_ID)
        if (config) {
            this.renderOverlayConfig(config, "overlay-legacy")
        }
    }

    showByLocation(locationId) {
        let config = this.configs.find(cfg => (ConfigType.OVERLAY === cfg.type) && cfg.locationId === locationId);
        if (config) {
            this.renderOverlayConfig(config, "overlay-location-id");
        }
    }

    showById(id) {
        let config = this.configs.find(x => x.id === id)
        if (config && config.type === ConfigType.EMBED) {
            this.renderEmbeddedConfig(config);
        } else if (config && config.type === ConfigType.OVERLAY) {
            this.renderOverlayConfig(config, "overlay-config-id");
        }
    }

    addMessageEventListener() {
        const findIframeElem = (iframeClassName, eventSource) => {
            const iframeCollection = Array.from(
                document.getElementsByClassName(iframeClassName)
            );
            return iframeCollection.find(
                iframe => iframe.contentWindow === eventSource
            );
        };

        window.addEventListener(
            'message',
            event => {
                if (typeof event.data !== 'string') return;
                const eventData = event.data.split(',');
                if (eventData.length === 0) return;

                let iFrameElem = findIframeElem(FlowContainer.EmbeddedIFrameClassName, event.source) ||
                    findIframeElem(FlowContainer.OverlayIFrameClassName, event.source);
                // If this did not come from our iframe, we just ignore it.
                if (!iFrameElem) return;
                let id = iFrameElem.attributes["data-af-iframe-config-id"]?.value;
                if (!id) {
                    console.error('found iframe but didn"t have configId', iFrameElem);
                    return;
                }
                let config = this.configs.find(x => x.id === id);
                if (!config) {
                    console.log('could not find configId', id, this.configs);
                    return;
                }

                this.handleEmbedFlowEvent(
                    eventData,
                    iFrameElem,
                    config);
            },
            false
        );
    }

    handleEmbedFlowEvent = (eventData, iframeElem, config) => {
        if (!iframeElem) return

        const targetElem = config.type === ConfigType.EMBED
            ? this.findClosestAncestor(iframeElem, 'fluent-af-exp-widget')
            : this.findClosestAncestor(iframeElem, 'fluent-af-exp-modal');


        // first page ready confirmed from program.
        var messageName = eventData[0];
        var messagePayload = eventData[1];
        if (messageName === 'data-ft-confirmed') {
            // second item in array is the count of available offers.
            if (messagePayload !== '0') {
                targetElem?.classList.remove('embedflow-hidden');
                // Track ad unit displayed event
                metrics.trackUnitDisplayed(config.id, config.sourceId, parseInt(eventData[1]));
            } else if (messagePayload === '0') {
                // Track ad unit no offers event
                metrics.trackUnitNoOffers(config.id, config.sourceId);

                // if no offers - send flowContainerClosed event
                this.sendModalClosedEvent();
            }
        }

        // close command received from program.
        if (messageName === 'data-ft-exit') {
            if (config.type === ConfigType.OVERLAY) {
                this.closeEmbedOverlayFlow(targetElem);
            }
            if (config.type === ConfigType.EMBED) {
                this.closeEmbedPageFlow(targetElem);
            }
        }

        if (config.type === ConfigType.EMBED &&
            messageName === 'data-ft-content-height'
        ) {
            // get the height of the content and set the iframe height
            iframeElem.style.height = messagePayload + 'px';

        }
    };

// close embed overlay flow
    closeEmbedOverlayFlow(targetElem) {
        this.sendModalClosedEvent();
        this.removeElementFromDOM(targetElem);
    }

// close embed page flow
    closeEmbedPageFlow(targetElem) {
        this.removeElementFromDOM(targetElem);
    }

    sendModalClosedEvent() {
        const event = new CustomEvent('flowContainerClosed');
        window.dispatchEvent(event);
    }

    removeElementFromDOM(targetElem) {
        targetElem.classList.add('embedflow-hidden');
        // remove iframe from DOM after 5 seconds
        setTimeout(() => targetElem.remove(), 5000);
    }

// get url with params
    getUrl(embedUrl) {
        if (embedUrl) {
            const url = new URL(embedUrl);

            if (performance) {
                const ttsDiff = performance.measure('fc-start', 'fc-available');
                this.params['tts'] = performance.now();
                this.params['ttsdiff'] = ttsDiff.duration;
            }

            // append params to url
            Object.keys(this.params).forEach(key =>
                url.searchParams.append(key, this.params[key])
            );

            return url;
        }
    }

// finds closest ancestor with class name
    findClosestAncestor(element, className) {
        let currentElement = element;
        while (currentElement) {
            if (currentElement.classList.contains(className)) return currentElement;
            currentElement = currentElement.parentNode;
        }
        return null;
    }

    getPartnerDomain() {
        let hostname = window.location.hostname;
        if (hostname.startsWith('www.')) {
            hostname = hostname.substring(4);
        }
        return hostname;
    }

    static EmbeddedIFrameClassName = 'fluent-af-exp-widget__iframe';

    embedPageTemplate(config) {
        return `
      <div class="fluent-af-exp-widget embedflow-hidden">
        <iframe scrolling="no"
            class="${FlowContainer.EmbeddedIFrameClassName}"
            src="${this.getUrl(config.url)}"
            data-af-iframe-config-id="${config.id}"
        </iframe>
      </div>
    `;
    }

    static OverlayIFrameClassName = 'fluent-af-exp-modal__iframe';

    embedOverlayTemplate(config) {
        return `
      <div class="fluent-af-exp-modal__container">
        <div class="fluent-af-exp-modal__body">
          <iframe
            class="${FlowContainer.OverlayIFrameClassName}"
            src="${this.getUrl(config.url)}"
            frameborder="0"
            width="100"
            height="100"
            border="0"
            data-af-iframe-config-id="${config.id}"
            >
          </iframe>
        </div>
      </div>
    `;
    }
}

