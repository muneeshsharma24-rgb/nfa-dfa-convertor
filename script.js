let network;

let states = localStorage.getItem("states").split(",");
let alphabet = localStorage.getItem("alphabet").split(",");
let start = localStorage.getItem("start");
let final = localStorage.getItem("final").split(",");
let data = JSON.parse(localStorage.getItem("transitions"));

/* 🔥 EPSILON CLOSURE */
function epsilonClosure(stateSet) {
    let stack = [...stateSet];
    let closure = new Set(stateSet);

    while (stack.length) {
        let state = stack.pop();

        let eps = data[state + "_ε"];
        if (eps) {
            eps.split(",").forEach(s => {
                let st = s.trim();
                if (!closure.has(st)) {
                    closure.add(st);
                    stack.push(st);
                }
            });
        }
    }

    return [...closure];
}

/* 🔥 MOVE FUNCTION */
function move(states, symbol) {
    let res = new Set();

    states.forEach(s => {
        let val = data[s + "_" + symbol];
        if (val) {
            val.split(",").forEach(v => res.add(v.trim()));
        }
    });

    return [...res];
}

/* 🔥 MAIN CONVERSION */
function convert() {

    let startClosure = epsilonClosure([start]);

    let dfa = [startClosure];
    let un = [startClosure];
    let trans = {};
    let finals = [];

    while (un.length) {
        let cur = un.shift();
        let key = cur.join(",") || "∅";
        trans[key] = {};

        alphabet.forEach(a => {

            let moved = move(cur, a);
            let closure = epsilonClosure(moved);

            let nk = closure.join(",") || "∅";
            trans[key][a] = nk;

            if (closure.length && !dfa.some(x => x.join(",") === nk)) {
                dfa.push(closure);
                un.push(closure);
            }
        });

        if (cur.some(s => final.includes(s))) {
            finals.push(key);
        }
    }

    show(dfa, trans, finals);
    draw(trans, finals);
}

/* 🔥 DISPLAY */
function show(states, trans, finals) {

    let html = "<h3>DFA States</h3>";
    states.forEach(s => html += `{${s.join(",")}}<br>`);

    html += "<h3>Final States</h3>";
    finals.forEach(f => html += `{${f}}<br>`);

    html += "<h3>Transition Table</h3>";
    html += "<table><tr><th>State</th>";

    alphabet.forEach(a => html += `<th>${a}</th>`);
    html += "</tr>";

    for (let s in trans) {
        html += `<tr><td>{${s}}</td>`;
        alphabet.forEach(a => {
            html += `<td>{${trans[s][a]}}</td>`;
        });
        html += "</tr>";
    }

    html += "</table>";

    document.getElementById("output").innerHTML = html;
}

/* 🔥 GRAPH (STABLE) */
function draw(trans, finals) {

    let nodes = [];
    let edgesMap = {};
    let added = new Set();

    for (let s in trans) {

        if (!added.has(s)) {
            nodes.push({
                id: s,
                label: s,
                shape: finals.includes(s) ? "doubleCircle" : "circle",
                color: s === start ? "#22c55e" : "#3b82f6",
                font: { color: "white" }
            });
            added.add(s);
        }

        for (let a in trans[s]) {
            let n = trans[s][a];

            if (!added.has(n)) {
                nodes.push({
                    id: n,
                    label: n,
                    shape: finals.includes(n) ? "doubleCircle" : "circle",
                    color: "#3b82f6",
                    font: { color: "white" }
                });
                added.add(n);
            }

            let key = s + "->" + n;

            if (!edgesMap[key]) {
                edgesMap[key] = { from: s, to: n, label: a };
            } else {
                edgesMap[key].label += "," + a;
            }
        }
    }

    let edges = Object.values(edgesMap);

    network = new vis.Network(
        document.getElementById("graph"),
        {
            nodes: new vis.DataSet(nodes),
            edges: new vis.DataSet(edges)
        },
        {
            physics: false,
            interaction: {
                dragNodes: false,
                dragView: false,
                zoomView: false
            },
            layout: {
                hierarchical: {
                    direction: "LR",
                    nodeSpacing: 120,
                    levelSeparation: 150
                }
            },
            edges: {
                arrows: "to"
            }
        }
    );

    network.once("afterDrawing", function () {
        network.fit();
    });
}

function downloadGraph() {
    let c = network.canvas.frame.canvas;
    let a = document.createElement("a");
    a.href = c.toDataURL();
    a.download = "dfa_graph.png";
    a.click();
}

function restart() {
    localStorage.clear();
    location.href = "index.html";
}

convert();