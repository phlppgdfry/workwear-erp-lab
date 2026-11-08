import React from "react";
import { createRoot } from "react-dom/client";
import { SupportDesk } from "../app/SupportDesk";
import { listMockExceptions } from "../lib/data";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(<React.StrictMode><SupportDesk exceptions={listMockExceptions()} publicDemo /></React.StrictMode>);
