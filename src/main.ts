import "./styles/tokens.css"
import "./styles/base.css"
import "./styles/utilities.css"
import "./app.css"
import App from "./App.svelte"
import { mount } from "svelte"

const app = mount(App, {
  target: document.getElementById("app")!,
})

export default app
