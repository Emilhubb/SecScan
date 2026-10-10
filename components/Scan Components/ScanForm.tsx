import React from "react";

const ScanForm = () => {
  return (
    <div >
      <div className="w-full flex flex-col gap-4 p-8 ">
        <p className="text-4xl font-medium text-white">
          Check your system for vulnerabilities in one click
        </p>
        <span className="text-lg text-slate-400">
          Only public data is collected. You will be able to view the results
          after the scan is complete.
        </span>
        <div className="flex w-full gap-4">
          <input
            type="text"
            placeholder="Enter your domain"
            className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-800"
          />
          <button className="shrink-0 rounded-lg bg-violet-500 px-5 py-2.5 text-white hover:bg-violet-800 focus:outline-none focus:ring-1 focus:ring-violet-800 cursor-pointer">
            Scan Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanForm;
