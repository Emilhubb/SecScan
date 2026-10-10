import React from "react";

const ScanForm = () => {
  return (
    <div className="flex flex-col h-full w-full p-10 gap-4">
      <div className="w-full flex flex-col gap-4 p-8">
        <p className="text-4xl p-4 font-medium text-white">
          Check your system for vulnerabilities in one click
        </p>
        <span className="text-lg text-slate-400 ml-10">
          Only public data is collected. You will be able to view the results
          after the scan is complete.
        </span>
        <div className=" w-full flex gap-4 p-2">
          <input
            type="text"
            placeholder="Enter your domain"
            className="w-full rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button className=" rounded-lg bg-violet-500 p-4 text-white hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500">
            Scan Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanForm;
