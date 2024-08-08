// import DashboardList from "./DashboardList";
import DashList2 from "./DashList2";
import FloatingActionButtons from "./FloatingActionButtons";

// add btn

function Dashboard() {
  return (
    <div className=" flex justify-center h-screen pt-20">
      <div className="container mx-auto">
        {/* <DashboardList /> */}
        <DashList2 />
        <FloatingActionButtons />
      </div>
    </div>
  );
}

export default Dashboard;
