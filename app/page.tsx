import ScanForm from "@/components/Scan Components/ScanForm";
import ScanResult from "@/components/Scan Components/ScanResult";

export default function Home() {
  return (
    <div className="flex flex-col items-center h-full w-full px-30 py-5 gap-4 text-white ">
      <ScanForm />
      <ScanResult />
    </div>
  );
}
