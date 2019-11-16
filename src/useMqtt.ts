import { useRef } from "react";
import mqtt from "mqtt";

interface Msg {
  payload: {};
}

export function useMqtt(
  topic: string,
  callback: (topic: string, msg: Msg) => void
) {
  const client = useRef(mqtt.connect("wss://test.mosquitto.org:8081"));
  client.current.on("connect", () => {
    client.current.subscribe(topic);
    client.current.on("message", (t, message) => {
      callback(t, JSON.parse(message.toString().replace(/\'/g, '"')));
    });
  });
}
