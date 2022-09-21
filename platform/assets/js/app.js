// If you want to use Phoenix channels, run `mix help phx.gen.channel`
// to get started and then uncomment the line below.
// import "./user_socket.js"

// You can include dependencies in two ways.
//
// The simplest option is to put them in assets/vendor and
// import them using relative paths:
//
//     import "../vendor/some-package.js"
//
// Alternatively, you can `npm install some-package --prefix assets` and import
// them using a path starting with the package name:
//
//     import "some-package"
//

// Include phoenix_html to handle method=PUT/DELETE in forms and buttons.
import "phoenix_html"
import TomSelect from "../node_modules/tom-select/dist/js/tom-select.complete"
// Establish Phoenix Socket and LiveView configuration.
import { Socket } from "phoenix"
import { LiveSocket } from "phoenix_live_view"
import topbar from "../vendor/topbar"
import mapboxgl from 'mapbox-gl'
import Alpine from 'alpinejs'

mapboxgl.accessToken = 'pk.eyJ1IjoibWlsZXNtY2MiLCJhIjoiY2t6ZzdzZmY0MDRobjJvbXBydWVmaXBpNSJ9.-aHM8bjOOsSrGI0VvZenAQ';

let Hooks = {};
Hooks.Modal = {
    mounted() {
        window.addEventListener("modal:close", (event) => {
            this.pushEventTo(event.detail.elem, "close_modal", {});
        })
    }
}

let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content");
let liveSocket = new LiveSocket("/live", Socket, {
    dom: {
        onBeforeElUpdated(from, to) {
            if (from._x_dataStack) {
                window.Alpine.clone(from, to);
            }
        },
    },
    params: { _csrf_token: csrfToken },
    hooks: Hooks
})

/**
 * https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
 * 
 * @param {String} HTML representing a single element
 * @return {Element}
 */
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

// Show progress bar on live navigation and form submits
topbar.config({ barColors: { 0: "#29d" }, shadowColor: "rgba(0, 0, 0, .3)" })
window.addEventListener("phx:page-loading-start", info => topbar.show())
window.addEventListener("phx:page-loading-stop", info => topbar.hide())

// Setup Alpine
window.Alpine = Alpine
Alpine.start()

// connect if there are any LiveViews on the page
liveSocket.connect()

// expose liveSocket on window for web console debug logs and latency simulation:
// >> liveSocket.enableDebug()
// >> liveSocket.enableLatencySim(1000)  // enabled for duration of browser session
// >> liveSocket.disableLatencySim()
window.liveSocket = liveSocket

let lockIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 m-px mb-1 inline" viewBox="0 0 20 20" fill="currentColor">
<path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
</svg>`;

function initializeSmartSelects() {
    // Make smart-selects interactive
    document.querySelectorAll("select:not(.ts-ignore *)").forEach(s => {
        if (s.tomselect) {
            return;
        }

        let prompt = "Select...";
        if (s.hasAttribute("multiple")) {
            prompt = "Select all that apply..."
        }
        let descriptions = JSON.parse(s.getAttribute("data-descriptions")) || {};
        let privileged = JSON.parse(s.getAttribute("data-privileged")) || [];

        let x = new TomSelect(`#${s.id}`, {
            maxOptions: null,
            placeholder: prompt,
            allowEmptyOption: true,
            hideSelected: false,
            hidePlaceholder: true,
            create: s.hasAttribute("data-allow-user-defined-options"),
            closeAfterSelect: !s.hasAttribute("multiple"),
            onItemAdd(_a, _b) {
                x.control_input.value = "";
            },
            plugins: s.hasAttribute("multiple") ? [
                "remove_button", "checkbox_options"
            ] : [],
            render: {
                option: function (data, escape) {
                    let desc = descriptions[data.value] || "";
                    if (desc.length != 0) {
                        desc = "— " + desc;
                    }
                    let requiresPrivilege = privileged.indexOf(data.text) >= 0;

                    let rawDepth = data.text.split("/").length - 1;
                    let effectiveDepth = rawDepth > 4 ? 4 : rawDepth;
                    let nestingDepth = ["ml-0", "ml-[25px]", "ml-[50px]", "ml-[75px]", "ml-[100px]"][effectiveDepth];

                    let lastComponentIndex = data.text.lastIndexOf('/');
                    let before = lastComponentIndex >= 0 ? data.text.slice(0, lastComponentIndex + 1) : "";
                    let after = data.text.slice(lastComponentIndex + 1);

                    return '<div class="flex rounded ' + nestingDepth + '"><div><span class="opacity-50">' + escape(before) + '</span><span>' + escape(after) + '</span><span class="text-gray-400">' + (requiresPrivilege ? lockIcon : '') + '&nbsp;' + escape(desc) + '</span></div></div>';
                },
                item: function (data, escape) {
                    let lastComponentIndex = data.text.lastIndexOf('/');
                    let before = lastComponentIndex >= 0 ? data.text.slice(0, lastComponentIndex + 1) : "";
                    let after = data.text.slice(lastComponentIndex + 1);

                    return '<div><div><span class="opacity-[60%]">' + escape(before) + '</span><span>' + escape(after) + '</span></div></div>';
                }
            }
        });
        x.control_input.setAttribute("phx-debounce", "blur");
        x.control_input.setAttribute("phx-update", "ignore");
    });
}

function initializeMaps() {
    document.querySelectorAll("map-pin").forEach(s => {
        if (s.classList.contains("mapboxgl-map")) {
            return;
        }

        let lon = parseFloat(s.getAttribute("lon"));
        let lat = parseFloat(s.getAttribute("lat"));

        let map = new mapboxgl.Map({
            container: s.id,
            style: 'mapbox://styles/mapbox/satellite-streets-v11',
            center: [lon, lat],
            zoom: 14
        });

        new mapboxgl.Marker({ color: "#60a5fa" })
            .setLngLat([lon, lat])
            .addTo(map);

        console.log(map);
    });

    document.querySelectorAll("map-events").forEach(s => {
        if (s.classList.contains("mapboxgl-map") || s.classList.contains("map-initialized")) {
            return;
        }

        let lon = parseFloat(s.getAttribute("lon"));
        let lat = parseFloat(s.getAttribute("lat"));
        let zoom = parseFloat(s.getAttribute("zoom") || 6);

        let map = new mapboxgl.Map({
            container: s.id,
            style: 'mapbox://styles/milesmcc/cl89ukz84000514oebbd92bjm',
            center: [lon, lat],
            zoom: zoom
        });

        map.on('load', function () {
            map.resize();
        });

        window.addEventListener("resize", () => {
            map.resize();
        });

        map.on("load", () => {
            let data = JSON.parse(s.getAttribute("data"));

            let geojson = {
                "type": "geojson",
                "data": {
                    "type": "FeatureCollection",
                    "features": data.map(incident => {
                        let colorForType = (type) => {
                            switch (type) {
                                case "policing": return '#14b8a6';
                                case "military": return '#60a5fa';
                                case "civilian": return '#ec4899';
                                case "weather": return '#22c55e';
                                default: return '#0f172a';
                            }
                        };

                        return {
                            "type": "Feature",
                            "properties": {
                                "description": `
                                    <div class="fixed w-[350px] h-[190px] flex rounded-lg shadow-lg items-center bg-white justify-around -z-50">
                                        <div class="font-medium text-lg text-md p-4">
                                            <span class="animate-pulse">Loading...</span>
                                        </div>
                                    </div>
                                    <iframe
                                        src='/incidents/${incident.slug}/card'
                                        width="350px"
                                        height="190px"
                                    />
                                `,
                                "slug": incident.slug,
                                "color": colorForType(incident.type)
                            },
                            'geometry': {
                                'type': 'Point',
                                'coordinates': [incident.lon, incident.lat]
                            }
                        }
                    })
                }
            };

            map.addSource('incidents', geojson);

            map.addLayer({
                'id': 'incidents',
                'type': 'circle',
                'source': 'incidents',
                'paint': {
                    'circle-radius': 7,
                    'circle-color': ["get", "color"],
                    'circle-opacity': 0.6,
                },
            });

            // When a click event occurs on a feature in the places layer, open a popup at the
            // location of the feature, with description HTML from its properties.
            map.on('click', 'incidents', (e) => {
                // Copy coordinates array.
                const coordinates = e.features[0].geometry.coordinates.slice();
                const description = e.features[0].properties.description;

                // Ensure that if the map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                new mapboxgl.Popup({ closeButton: false })
                    .setLngLat(coordinates)
                    .setHTML(description)
                    .setMaxWidth("600px")
                    .addTo(map);
            });

            // Change the cursor to a pointer when the mouse is over the incidents layer.
            map.on('mouseenter', 'incidents', () => {
                map.getCanvas().style.cursor = 'zoom-in';
            });

            // Change it back to a pointer when it leaves.
            map.on('mouseleave', 'incidents', () => {
                map.getCanvas().style.cursor = '';
            });
        });

        s.classList.add("map-initialized");
    });
}

function debounce(func, timeout = 25) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

// Used to centralize modal closing logic. See Hooks.Modal for core logic.
window.closeModal = debounce((event) => {
    // Find the target, if possible.
    let elem = event.target;
    if (confirm("Are you sure you want to exit? Any unsaved changes will be lost.")) {
        let event = new CustomEvent("modal:close", { detail: { elem } });
        window.dispatchEvent(event);
    }
});

window.toggleClass = (id, classname) => {
    let elem = document.getElementById(id);
    elem.classList.toggle(classname);
}

document.addEventListener("phx:update", initializeSmartSelects);
document.addEventListener("load", initializeSmartSelects);

document.addEventListener("phx:update", initializeMaps);
document.addEventListener("load", initializeMaps);

// Used to set the clipboard when copying hash information
window.setClipboard = (text) => {
    const type = "text/plain";
    const blob = new Blob([text], { type });
    const data = [new ClipboardItem({ [type]: blob })];

    navigator.clipboard.write(data).then(
        () => {
            alert("Copied to your clipboard!")
        },
        () => {
            alert("Unable to write to your clipboard.")
        }
    );
}
