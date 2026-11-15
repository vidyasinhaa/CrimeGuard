/*
   CrimeGuard - web interface (script.js)

   This file has the SAME logic as main.c, written in simple JavaScript:
     - Dijkstra's algorithm  -> shortest route, safe route, nearest facility
     - BFS (queue) and DFS (recursion) -> connectivity
     - bubble sort           -> hotspots
     - linear search         -> crime records filter
   Roads are kept in a simple array. Crimes are kept in an array too.
   Data is saved in the browser (localStorage), like the .txt files in C.
*/

var INF = 9999;        /* means "cannot reach" */
var PENALTY = 20;      /* extra km for a HIGH risk place in the safe route */

var crimeTypeNames = ["", "Theft", "Robbery", "Assault", "Harassment", "Vandalism", "Accident"];
var facilityTypeNames = ["", "Police Station", "Hospital", "Fire Station"];
var riskNames = ["LOW", "MEDIUM", "HIGH"];
var riskColors = ["#2e9e5b", "#e0a100", "#d64545"];

var numPlaces = placeNames.length;
var crimes = [];       /* list of crimes */
var roads = [];        /* list of roads */
var nextId = 1;        /* id of the next new crime */


/* ================== SMALL HELPERS ================== */

/* stops text typed by the user from breaking the page */
function safe(text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function two(n) {
    if (n < 10) {
        return "0" + n;
    }
    return "" + n;
}

/* today's date in YYYY-MM-DD (the format of the date box) */
function todayValue() {
    var d = new Date();
    return d.getFullYear() + "-" + two(d.getMonth() + 1) + "-" + two(d.getDate());
}

/* makes an independent copy of a list */
function copyList(list) {
    return JSON.parse(JSON.stringify(list));
}

/* turns a list of place numbers into text:  A -> B -> C */
function pathToText(path) {
    var text = "";
    for (var i = 0; i < path.length; i++) {
        if (i > 0) {
            text = text + " &rarr; ";
        }
        text = text + safe(placeNames[path[i]]);
    }
    return text;
}

function riskBadge(level) {
    return '<span class="badge" style="background:' + riskColors[level] + '">' + riskNames[level] + '</span>';
}


/* ================== LOAD AND SAVE (like the txt files) ================== */

function loadData() {
    crimes = copyList(sampleCrimes);
    roads = copyList(sampleRoads);

    try {
        var savedCrimes = localStorage.getItem("crimeguard_crimes");
        var savedRoads = localStorage.getItem("crimeguard_roads");
        if (savedCrimes != null) {
            crimes = JSON.parse(savedCrimes);
        }
        if (savedRoads != null) {
            roads = JSON.parse(savedRoads);
        }
    } catch (e) {
        /* browser does not allow saving: we simply use the sample data */
    }

    nextId = 1;
    for (var i = 0; i < crimes.length; i++) {
        if (crimes[i].id >= nextId) {
            nextId = crimes[i].id + 1;
        }
    }
}

function saveCrimes() {
    try {
        localStorage.setItem("crimeguard_crimes", JSON.stringify(crimes));
    } catch (e) {
    }
}

function saveRoads() {
    try {
        localStorage.setItem("crimeguard_roads", JSON.stringify(roads));
    } catch (e) {
    }
}


/* ================== CRIMES AND RISK ================== */

/* how many crimes happened at this place */
function countCrimes(place) {
    var count = 0;
    for (var i = 0; i < crimes.length; i++) {
        if (crimes[i].place == place) {
            count++;
        }
    }
    return count;
}

/* 0 = LOW (0-1 crimes), 1 = MEDIUM (2-3 crimes), 2 = HIGH (4 or more) */
function riskLevel(place) {
    var n = countCrimes(place);
    if (n >= 4) {
        return 2;
    }
    if (n >= 2) {
        return 1;
    }
    return 0;
}


/* ================== DIJKSTRA'S ALGORITHM ================== */

/* all roads that start from place u: gives a list of {to, km, blocked} */
function getRoadsOf(u) {
    var list = [];
    for (var i = 0; i < roads.length; i++) {
        if (roads[i].a == u) {
            list.push({ to: roads[i].b, km: roads[i].km, blocked: roads[i].blocked });
        }
        if (roads[i].b == u) {
            list.push({ to: roads[i].a, km: roads[i].km, blocked: roads[i].blocked });
        }
    }
    return list;
}

/* find the not-yet-done place with the smallest distance */
function minPlace(dist, done) {
    var best = -1;
    for (var i = 0; i < numPlaces; i++) {
        if (done[i] == false && dist[i] < INF) {
            if (best == -1 || dist[i] < dist[best]) {
                best = i;
            }
        }
    }
    return best;
}

/*
   safe = 0 -> normal shortest route
   safe = 1 -> HIGH risk places get extra PENALTY km, so they are avoided
   Blocked roads are always skipped.
   Gives back dist (shortest distances) and prev (the place before, to rebuild the route).
*/
function dijkstra(src, safeMode) {
    var dist = [];
    var prev = [];
    var done = [];

    for (var i = 0; i < numPlaces; i++) {
        dist[i] = INF;
        prev[i] = -1;
        done[i] = false;
    }
    dist[src] = 0;

    for (var count = 0; count < numPlaces; count++) {
        var u = minPlace(dist, done);
        if (u == -1) {
            break;                      /* nothing more is reachable */
        }
        done[u] = true;

        var list = getRoadsOf(u);
        for (var j = 0; j < list.length; j++) {
            var r = list[j];
            if (r.blocked == 0) {
                var cost = r.km;
                if (safeMode == 1 && riskLevel(r.to) == 2) {
                    cost = cost + PENALTY;
                }
                if (dist[u] + cost < dist[r.to]) {
                    dist[r.to] = dist[u] + cost;
                    prev[r.to] = u;
                }
            }
        }
    }
    return { dist: dist, prev: prev };
}

/* builds the route as a list of places, using recursion */
function getPath(prev, place) {
    if (prev[place] == -1) {
        return [place];
    }
    var path = getPath(prev, prev[place]);
    path.push(place);
    return path;
}

/* real length of the road between a and b */
function roadKm(a, b) {
    for (var i = 0; i < roads.length; i++) {
        if ((roads[i].a == a && roads[i].b == b) || (roads[i].a == b && roads[i].b == a)) {
            return roads[i].km;
        }
    }
    return 0;
}

/* total km of a route (without penalty) */
function pathKm(path) {
    var total = 0;
    for (var i = 0; i < path.length - 1; i++) {
        total = total + roadKm(path[i], path[i + 1]);
    }
    return total;
}

/* HIGH risk places in the middle of the route (start and end are not counted) */
function countRisky(path) {
    var count = 0;
    for (var i = 1; i < path.length - 1; i++) {
        if (riskLevel(path[i]) == 2) {
            count++;
        }
    }
    return count;
}

/* facilities of one type within k km of a place, nearest first */
function findFacilities(place, type, k) {
    var result = dijkstra(place, 0);
    var found = [];

    for (var i = 0; i < facilities.length; i++) {
        var f = facilities[i];
        if (f.type == type && result.dist[f.place] <= k) {
            found.push({
                name: f.name,
                place: f.place,
                km: result.dist[f.place],
                path: getPath(result.prev, f.place)
            });
        }
    }
    found.sort(function (x, y) { return x.km - y.km; });
    return found;
}


/* ================== BFS AND DFS ================== */

/* BFS uses a queue: visits places level by level */
function bfs(start) {
    var queue = [];
    var level = [];
    var seen = [];
    for (var i = 0; i < numPlaces; i++) {
        seen[i] = false;
    }

    queue.push(start);
    seen[start] = true;
    level[start] = 0;

    var order = [];                         /* places in the order they are visited */
    while (queue.length > 0) {
        var u = queue.shift();              /* take one place out of the queue */
        order.push(u);

        var list = getRoadsOf(u);
        for (var j = 0; j < list.length; j++) {
            var r = list[j];
            if (r.blocked == 0 && seen[r.to] == false) {
                seen[r.to] = true;
                level[r.to] = level[u] + 1;
                queue.push(r.to);
            }
        }
    }
    return { order: order, level: level };
}

/* DFS uses recursion: goes as deep as possible, then comes back */
function dfs(u, visited, order) {
    visited[u] = true;
    order.push(u);

    var list = getRoadsOf(u);
    for (var j = 0; j < list.length; j++) {
        var r = list[j];
        if (r.blocked == 0 && visited[r.to] == false) {
            dfs(r.to, visited, order);
        }
    }
}


/* ================== THE MAP (SVG drawing) ================== */

/* routes = list of {path: [places], color: "#...", width: 6} drawn on top of the roads */
function renderMap(routes) {
    var svg = '<svg viewBox="0 0 600 440" xmlns="http://www.w3.org/2000/svg">';

    /* roads */
    for (var i = 0; i < roads.length; i++) {
        var r = roads[i];
        var x1 = placeX[r.a];
        var y1 = placeY[r.a];
        var x2 = placeX[r.b];
        var y2 = placeY[r.b];
        var cls = "road";
        if (r.blocked == 1) {
            cls = "road blocked";
        }
        svg += '<line class="' + cls + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>';
    }

    /* highlighted routes */
    for (var k = 0; k < routes.length; k++) {
        var path = routes[k].path;
        for (var p = 0; p < path.length - 1; p++) {
            svg += '<line class="route" stroke="' + routes[k].color + '" stroke-width="' + routes[k].width + '"'
                + ' x1="' + placeX[path[p]] + '" y1="' + placeY[path[p]] + '"'
                + ' x2="' + placeX[path[p + 1]] + '" y2="' + placeY[path[p + 1]] + '"/>';
        }
    }

    /* km labels */
    for (var m = 0; m < roads.length; m++) {
        var mx = (placeX[roads[m].a] + placeX[roads[m].b]) / 2;
        var my = (placeY[roads[m].a] + placeY[roads[m].b]) / 2;
        svg += '<text class="km" x="' + mx + '" y="' + (my - 4) + '">' + roads[m].km + '</text>';
    }

    /* places */
    for (var n = 0; n < numPlaces; n++) {
        svg += '<circle cx="' + placeX[n] + '" cy="' + placeY[n] + '" r="15" fill="' + riskColors[riskLevel(n)] + '"/>';
        svg += '<text class="num" x="' + placeX[n] + '" y="' + (placeY[n] + 5) + '">' + n + '</text>';
        svg += '<text class="name" x="' + placeX[n] + '" y="' + (placeY[n] + 32) + '">' + safe(placeNames[n]) + '</text>';
    }

    svg += '</svg>';
    document.getElementById("map").innerHTML = svg;
}


/* ================== FILLING THE DROP-DOWN LISTS ================== */

function fillPlaceSelect(id, withAll) {
    var html = "";
    if (withAll) {
        html = '<option value="-1">All places</option>';
    }
    for (var i = 0; i < numPlaces; i++) {
        html += '<option value="' + i + '">' + i + ". " + safe(placeNames[i]) + '</option>';
    }
    document.getElementById(id).innerHTML = html;
}

function fillTypeSelect(id, names, withAll) {
    var html = "";
    if (withAll) {
        html = '<option value="0">All types</option>';
    }
    for (var i = 1; i < names.length; i++) {
        html += '<option value="' + i + '">' + names[i] + '</option>';
    }
    document.getElementById(id).innerHTML = html;
}


/* ================== TABS ================== */

function showTab(name) {
    var contents = document.getElementsByClassName("tab-content");
    for (var i = 0; i < contents.length; i++) {
        contents[i].style.display = "none";
    }
    document.getElementById("tab-" + name).style.display = "block";

    var buttons = document.getElementsByClassName("tab-btn");
    for (var j = 0; j < buttons.length; j++) {
        if (buttons[j].getAttribute("data-tab") == name) {
            buttons[j].classList.add("active");
        } else {
            buttons[j].classList.remove("active");
        }
    }
    renderMap([]);          /* clear old route lines when we change the tab */
}


/* ================== FEATURE 1: REPORT A CRIME ================== */

function onReportCrime() {
    var type = Number(document.getElementById("reportType").value);
    var place = Number(document.getElementById("reportPlace").value);
    var dateValue = document.getElementById("reportDate").value;
    var desc = document.getElementById("reportDesc").value.trim();

    if (dateValue == "" || desc == "") {
        document.getElementById("reportResult").innerHTML =
            '<div class="msg bad">Please fill the date and the description.</div>';
        return;
    }

    /* the date box gives YYYY-MM-DD, we store DD-MM-YYYY like the C program */
    var parts = dateValue.split("-");
    var date = parts[2] + "-" + parts[1] + "-" + parts[0];

    var crime = { id: nextId, type: type, place: place, date: date, desc: desc };
    nextId++;
    crimes.push(crime);             /* add at the end of the list */
    saveCrimes();

    document.getElementById("reportDesc").value = "";
    document.getElementById("helpResult").innerHTML = "";

    var html = '<div class="msg good">Crime saved with ID ' + crime.id + '. Risk level of <b>'
        + safe(placeNames[place]) + '</b> is now ' + riskBadge(riskLevel(place)) + '</div>';
    html += '<p class="note">Find the nearest help from this place:</p>';
    html += '<div class="form row">';
    html += '<button class="btn small" onclick="onShowNearest(' + place + ', 1)">Police Station</button>';
    html += '<button class="btn small" onclick="onShowNearest(' + place + ', 2)">Hospital</button>';
    html += '<button class="btn small" onclick="onShowNearest(' + place + ', 3)">Fire Station</button>';
    html += '</div>';
    document.getElementById("reportResult").innerHTML = html;

    renderMap([]);
    renderCrimes();
    renderHotspots();
}

/* shows the nearest facility of one type after reporting */
function onShowNearest(place, type) {
    var found = findFacilities(place, type, 100);
    var html = "";

    if (found.length == 0) {
        html = '<div class="msg bad">No reachable ' + facilityTypeNames[type] + ' found (roads may be blocked).</div>';
        renderMap([]);
    } else {
        var best = found[0];
        html = '<div class="card"><b>Nearest ' + facilityTypeNames[type] + ': ' + safe(best.name) + '</b>'
            + '<p>' + pathToText(best.path) + '</p>'
            + '<p><b>' + best.km + ' km</b></p>'
            + '<p class="note">This is only information. The system does not contact the police.</p></div>';
        renderMap([{ path: best.path, color: "#2f5bea", width: 6 }]);
    }
    document.getElementById("helpResult").innerHTML = html;
}


/* ================== FEATURE 2: CRIME RECORDS ================== */

function renderCrimes() {
    var typeFilter = Number(document.getElementById("filterType").value);
    var placeFilter = Number(document.getElementById("filterPlace").value);

    /* linear search: show only the crimes that match the filters */
    var rows = "";
    var shown = 0;
    for (var i = 0; i < crimes.length; i++) {
        var c = crimes[i];
        if ((typeFilter == 0 || c.type == typeFilter) && (placeFilter == -1 || c.place == placeFilter)) {
            rows += "<tr><td>" + c.id + "</td><td>" + crimeTypeNames[c.type] + '</td><td class="nowrap">'
                + safe(placeNames[c.place]) + '</td><td class="nowrap">' + c.date + '</td><td class="desc">'
                + safe(c.desc) + "</td></tr>";
            shown++;
        }
    }

    var table = '<table><thead><tr><th>ID</th><th>Type</th><th>Place</th><th>Date</th><th>Description</th></tr></thead><tbody>'
        + rows + '</tbody></table>';
    if (shown == 0) {
        table = '<div class="msg bad">No crimes found.</div>';
    }
    document.getElementById("crimeTable").innerHTML =
        '<p class="note">' + shown + ' of ' + crimes.length + ' crime(s)</p>' + table;

    /* count of each crime type */
    var chips = "";
    for (var t = 1; t < crimeTypeNames.length; t++) {
        var count = 0;
        for (var j = 0; j < crimes.length; j++) {
            if (crimes[j].type == t) {
                count++;
            }
        }
        chips += '<span class="chip">' + crimeTypeNames[t] + ' <b>' + count + '</b></span>';
    }
    document.getElementById("typeCounts").innerHTML = chips;
}


/* ================== FEATURE 3: NEARBY FACILITY ================== */

function onNearby() {
    var place = Number(document.getElementById("nearbyPlace").value);
    var type = Number(document.getElementById("nearbyType").value);
    var k = Number(document.getElementById("nearbyKm").value);
    var found = findFacilities(place, type, k);

    if (found.length == 0) {
        document.getElementById("nearbyResult").innerHTML = '<div class="msg bad">No '
            + facilityTypeNames[type] + ' found within ' + k + ' km (or the roads are blocked).</div>';
        renderMap([]);
        return;
    }

    var html = "";
    for (var i = 0; i < found.length; i++) {
        var tag = "";
        if (i == 0) {
            tag = ' <span class="badge" style="background:#2f5bea">NEAREST</span>';
        }
        html += '<div class="card"><b>' + safe(found[i].name) + '</b>' + tag
            + '<p>at ' + safe(placeNames[found[i].place]) + ' &middot; <b>' + found[i].km + ' km</b></p>'
            + '<p>' + pathToText(found[i].path) + '</p></div>';
    }
    document.getElementById("nearbyResult").innerHTML = html;
    renderMap([{ path: found[0].path, color: "#2f5bea", width: 6 }]);
}


/* ================== FEATURE 4: SAFE ROUTE ================== */

function routeCard(title, path, color) {
    return '<div class="card" style="border-left:5px solid ' + color + '"><b>' + title + '</b>'
        + '<p>' + pathToText(path) + '</p>'
        + '<p><b>' + pathKm(path) + ' km</b> &middot; High risk places on the way: <b>' + countRisky(path) + '</b></p></div>';
}

function onSafeRoute() {
    var src = Number(document.getElementById("routeFrom").value);
    var dest = Number(document.getElementById("routeTo").value);
    var box = document.getElementById("routeResult");

    if (src == dest) {
        box.innerHTML = '<div class="msg bad">Source and destination are the same!</div>';
        renderMap([]);
        return;
    }

    /* step 1: normal shortest route */
    var normal = dijkstra(src, 0);
    if (normal.dist[dest] == INF) {
        box.innerHTML = '<div class="msg bad">No route available. Roads are blocked!</div>';
        renderMap([]);
        return;
    }
    var path1 = getPath(normal.prev, dest);
    var risky1 = countRisky(path1);
    var html = routeCard("Shortest route", path1, "#2f5bea");
    var routes = [{ path: path1, color: "#2f5bea", width: 9 }];

    /* step 2: if it has HIGH risk places, look for a safer route */
    if (risky1 == 0) {
        html += '<div class="msg good">This route has no high risk place. It is already safe.</div>';
    } else {
        var safer = dijkstra(src, 1);
        var path2 = getPath(safer.prev, dest);
        var risky2 = countRisky(path2);

        if (risky2 < risky1) {
            html += routeCard("Safer route", path2, "#1f9d55");
            html += '<div class="msg good">The safer route is ' + (pathKm(path2) - pathKm(path1))
                + ' km longer but avoids ' + (risky1 - risky2) + ' high risk place(s).</div>';
            routes.push({ path: path2, color: "#1f9d55", width: 5 });
        } else {
            html += '<div class="msg bad">No safer route is available.</div>';
        }
    }
    box.innerHTML = html;
    renderMap(routes);
}


/* ================== FEATURE 5: ROAD STATUS ================== */

function renderRoads() {
    var rows = "";
    for (var i = 0; i < roads.length; i++) {
        var r = roads[i];
        var status = '<span class="badge" style="background:#2e9e5b">OPEN</span>';
        var button = '<button class="btn small danger" onclick="onToggleRoad(' + i + ')">Block</button>';
        if (r.blocked == 1) {
            status = '<span class="badge" style="background:#d64545">BLOCKED</span>';
            button = '<button class="btn small" onclick="onToggleRoad(' + i + ')">Open</button>';
        }
        rows += "<tr><td>" + safe(placeNames[r.a]) + " &harr; " + safe(placeNames[r.b]) + "</td><td>"
            + r.km + " km</td><td>" + status + "</td><td>" + button + "</td></tr>";
    }
    document.getElementById("roadTable").innerHTML =
        "<table><thead><tr><th>Road</th><th>Length</th><th>Status</th><th></th></tr></thead><tbody>"
        + rows + "</tbody></table>";
}

function onToggleRoad(index) {
    if (roads[index].blocked == 1) {
        roads[index].blocked = 0;
    } else {
        roads[index].blocked = 1;
    }
    saveRoads();
    renderRoads();
    renderMap([]);
    document.getElementById("routeResult").innerHTML = "";
    document.getElementById("connectResult").innerHTML = "";
}


/* ================== FEATURE 6: HOTSPOTS AND CONNECTIVITY ================== */

function renderHotspots() {
    var count = [];
    var order = [];
    for (var i = 0; i < numPlaces; i++) {
        count[i] = countCrimes(i);
        order[i] = i;
    }

    /* bubble sort: the place with the most crimes comes first */
    for (var a = 0; a < numPlaces - 1; a++) {
        for (var b = 0; b < numPlaces - 1 - a; b++) {
            if (count[order[b]] < count[order[b + 1]]) {
                var temp = order[b];
                order[b] = order[b + 1];
                order[b + 1] = temp;
            }
        }
    }

    var biggest = count[order[0]];
    if (biggest == 0) {
        biggest = 1;
    }

    var html = "";
    for (var k = 0; k < numPlaces; k++) {
        var place = order[k];
        var width = (count[place] / biggest) * 100;
        html += '<div class="hot-row"><span class="hot-name">' + (k + 1) + ". " + safe(placeNames[place]) + '</span>'
            + '<span class="bar-box"><span class="bar" style="width:' + width + '%;background:'
            + riskColors[riskLevel(place)] + '"></span></span>'
            + '<span class="hot-count">' + count[place] + '</span>' + riskBadge(riskLevel(place)) + '</div>';
    }
    document.getElementById("hotspotList").innerHTML = html;
}

function onConnectivity() {
    var start = Number(document.getElementById("connectStart").value);

    /* BFS: show places level by level */
    var b = bfs(start);
    var html = '<div class="card"><b>BFS (level wise) from ' + safe(placeNames[start]) + '</b>';
    var maxLevel = 0;
    for (var i = 0; i < b.order.length; i++) {
        if (b.level[b.order[i]] > maxLevel) {
            maxLevel = b.level[b.order[i]];
        }
    }
    for (var lv = 0; lv <= maxLevel; lv++) {
        var names = "";
        for (var j = 0; j < b.order.length; j++) {
            if (b.level[b.order[j]] == lv) {
                if (names != "") {
                    names += ", ";
                }
                names += safe(placeNames[b.order[j]]);
            }
        }
        html += '<p><span class="chip">Level ' + lv + '</span> ' + names + '</p>';
    }
    html += '</div>';

    /* DFS: go deep first */
    var visited = [];
    for (var v = 0; v < numPlaces; v++) {
        visited[v] = false;
    }
    var dfsOrder = [];
    dfs(start, visited, dfsOrder);
    html += '<div class="card"><b>DFS (deep) from ' + safe(placeNames[start]) + '</b><p>' + pathToText(dfsOrder) + '</p></div>';

    /* places that cannot be reached */
    html += '<div class="msg good">Reachable places: ' + dfsOrder.length + ' out of ' + numPlaces + '</div>';
    if (dfsOrder.length < numPlaces) {
        var lost = "";
        for (var p = 0; p < numPlaces; p++) {
            if (visited[p] == false) {
                lost += '<span class="chip bad">' + safe(placeNames[p]) + '</span>';
            }
        }
        html += '<div class="msg bad">Not reachable (cut off by blocked roads):</div><div class="chips">' + lost + '</div>';
    }
    document.getElementById("connectResult").innerHTML = html;
}


/* ================== FILES: DOWNLOAD AND RESET ================== */

/* same format as the .txt files of the C program */
function downloadFile(fileName, text) {
    var blob = new Blob([text], { type: "text/plain" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
}

function onDownloadCrimes() {
    var text = "";
    for (var i = 0; i < crimes.length; i++) {
        var c = crimes[i];
        text += c.id + " " + c.type + " " + c.place + " " + c.date + " " + c.desc + "\n";
    }
    downloadFile("crimes.txt", text);
}

function onDownloadRoads() {
    var text = "";
    for (var i = 0; i < roads.length; i++) {
        var r = roads[i];
        text += r.a + " " + r.b + " " + r.km + " " + r.blocked + "\n";
    }
    downloadFile("roads.txt", text);
}

function onResetData() {
    if (confirm("Delete all your changes and go back to the sample data?")) {
        try {
            localStorage.removeItem("crimeguard_crimes");
            localStorage.removeItem("crimeguard_roads");
        } catch (e) {
        }
        loadData();
        document.getElementById("reportResult").innerHTML = "";
        document.getElementById("helpResult").innerHTML = "";
        document.getElementById("routeResult").innerHTML = "";
        document.getElementById("nearbyResult").innerHTML = "";
        document.getElementById("connectResult").innerHTML = "";
        renderAll();
    }
}


/* ================== START ================== */

function renderAll() {
    renderMap([]);
    renderCrimes();
    renderRoads();
    renderHotspots();
}

function startApp() {
    loadData();

    fillTypeSelect("reportType", crimeTypeNames, false);
    fillPlaceSelect("reportPlace", false);
    fillTypeSelect("filterType", crimeTypeNames, true);
    fillPlaceSelect("filterPlace", true);
    fillPlaceSelect("nearbyPlace", false);
    fillTypeSelect("nearbyType", facilityTypeNames, false);
    fillPlaceSelect("routeFrom", false);
    fillPlaceSelect("routeTo", false);
    fillPlaceSelect("connectStart", false);

    document.getElementById("reportDate").value = todayValue();
    document.getElementById("routeTo").value = 5;       /* a good example: JIIT to Film City */

    showTab("report");
    renderAll();
}

startApp();
