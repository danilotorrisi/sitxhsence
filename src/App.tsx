import React, { useRef, useEffect } from "react";
import logo from "./logo.svg";
import { useMqtt } from "./useMqtt";
import ForceGraph3D from "3d-force-graph";
import ForceGraph3DVR from "3d-force-graph-vr";
import "./App.css";
import { v4 } from "uuid";
import tinygradient from "tinygradient";
import { flatten, isEmpty } from "lodash";
import tinycolor from "tinycolor2";

const VR_ENABLED = false;
const BUFFER_SIZE = 10;

const gradient = tinygradient([
  tinycolor("#D13913"),
  tinycolor("#E1E8ED"),
  tinycolor("#0F9960")
]);

const App: React.FC = () => {
  const ref = useRef();
  const values = useRef({
    "e_sensor/pos01.temperature": [],
    "e_sensor/pos01.co2": [],
    "e_sensor/pos01.pm2.5": [],
    "e_sensor/pos01.pm10": [],
    "e_sensor/pos02.temperature": [],
    "e_sensor/pos02.co2": [],
    "e_sensor/pos02.pm2.5": [],
    "e_sensor/pos02.pm10": [],
    "e_sensor/pos03.temperature": [],
    "e_sensor/pos03.co2": [],
    "e_sensor/pos03.pm2.5": [],
    "e_sensor/pos03.pm10": []
  });
  const graph = useRef(
    (VR_ENABLED ? ForceGraph3DVR() : ForceGraph3D())
      .linkColor("white")
      .linkWidth(({ old }) => {
        if (old != null) {
          return 1 + (Number(BUFFER_SIZE - old) / Number(BUFFER_SIZE)) * 2;
        }
        return 1;
      })
      .nodeOpacity(1)
      .linkOpacity(0.4)
      .nodeColor(({ id, delta }) => {
        if (id.startsWith("e_sensor")) {
          return "#137CBD";
        }
        if (["co2", "temperature", "pm2.5", "pm10"].includes(id)) {
          return "#96622D";
        }
        if (delta != null) {
          return gradient.rgbAt(Math.max(0, Math.min(delta / 2, 1)));
        }
        return "#8F398F";
      })
      .nodeVal(({ delta }) => {
        if (delta != null) {
          return delta + 2;
        } else {
          return 5;
        }
      })
      .nodeLabel(({ delta, key, id }) => {
        if (delta != null) {
          const change = delta - 1;
          return `${change * 100} %`;
        } else {
          return key || id;
        }
      })
  );
  const data = {
    nodes: [
      { id: "e_sensor/pos01" },
      { id: "e_sensor/pos02" },
      { id: "e_sensor/pos03" },
      { id: "temperature" },
      { id: "co2" },
      { id: "pm2.5" },
      { id: "pm10" }
    ],
    links: [
      { source: "e_sensor/pos01", target: "co2" },
      { source: "e_sensor/pos01", target: "temperature" },
      { source: "e_sensor/pos01", target: "pm2.5" },
      { source: "e_sensor/pos01", target: "pm10" },
      { source: "e_sensor/pos02", target: "co2" },
      { source: "e_sensor/pos02", target: "temperature" },
      { source: "e_sensor/pos02", target: "pm2.5" },
      { source: "e_sensor/pos02", target: "pm10" },
      { source: "e_sensor/pos03", target: "co2" },
      { source: "e_sensor/pos03", target: "temperature" },
      { source: "e_sensor/pos03", target: "pm2.5" },
      { source: "e_sensor/pos03", target: "pm10" }
    ]
  };
  const mqtt = useMqtt("e_sensor/+", (topic, msg) => {
    const prevData = graph.current.graphData();
    console.log(topic, msg);
    const id = v4();

    const keys = Object.keys(msg).filter(f => f !== "now");

    keys.forEach(key => {
      const t = `${topic}.${key}`;
      if (values.current[t].length > BUFFER_SIZE) {
        values.current[t].pop();
      }
      const last = !isEmpty(values.current[t])
        ? values.current[t][values.current[t].length - 1]
        : null;

      const delta = last != null ? msg[key] / last.value : null;
      console.log(delta);
      values.current[t].push({ id: v4(), key, value: msg[key], delta });
    });
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const nodes = flatten(
        Object.keys(values.current).map(k => {
          return values.current[k].map((val, index) => ({ ...val, index }));
        })
      ).filter(({ delta }) => delta != null);

      const links = flatten(
        nodes.map(k => {
          return { old: k.index, source: k.key, target: k.id };
        })
      );

      graph.current.graphData({
        nodes: [...data.nodes, ...nodes],
        links: [...data.links, ...links]
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    graph.current(ref.current).graphData(data);
  });

  return <div id="graph" style={{ width: "100%", height: "100%" }} ref={ref} />;
};

export default App;
