"use client";
import { Printer } from "lucide-react";

export function PrintButton() {
  return <div className="no-print sticky top-0 z-10 flex justify-center bg-gray-100 p-3"><button onClick={() => window.print()} className="btn btn-primary"><Printer className="size-4" />Print</button></div>;
}
