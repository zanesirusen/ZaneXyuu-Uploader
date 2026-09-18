import { Component } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./themes.css";
import "./parity.css";
import "./publish.css";
import "./publish-progress.css";

class AppErrorBoundary extends Component {
	state = { error: null };

	static getDerivedStateFromError(error) {
		return { error };
	}

	componentDidCatch(error, info) {
		console.error("ZaneXyuu UI error", error, info);
	}

	render() {
		if (!this.state.error) return this.props.children;
		return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", color: "#e8f0f5", background: "#0b1118", fontFamily: "Manrope, sans-serif" }}><section style={{ width: "min(100%, 520px)", padding: "28px", border: "1px solid #253542", borderRadius: "12px", background: "#111a23" }}><p style={{ color: "#ff8e8e", fontSize: "11px", letterSpacing: "1px" }}>WORKSPACE ERROR</p><h1 style={{ margin: "8px 0", fontSize: "24px" }}>The workspace could not load.</h1><p style={{ color: "#8d9da9", lineHeight: 1.6 }}>Refresh the page and try again. If the problem continues, check the deployment logs.</p><button type="button" onClick={() => window.location.reload()} style={{ marginTop: "12px", padding: "10px 14px", border: 0, borderRadius: "6px", color: "#081119", background: "#71b9ff", cursor: "pointer" }}>Reload workspace</button></section></main>;
	}
}

createRoot(document.getElementById("root")).render(<AppErrorBoundary><App /></AppErrorBoundary>);
