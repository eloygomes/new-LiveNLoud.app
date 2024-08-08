import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import FAKEDATA from "../../../FAKEDATA";
import "../../../src/main"; // Certifique-se de importar o arquivo CSS

const formatInstruments = (params) => {
  const instruments = params.row.Instruments;

  const getLinkClass = (isActive) => (isActive ? "" : "disabled-link");
  // Trocar esses a href por link to
  const links = [
    <a key="g1" href="#guitar01" className={getLinkClass(instruments.guitar01)}>
      G1
    </a>,
    <a key="g2" href="#guitar02" className={getLinkClass(instruments.guitar02)}>
      G2
    </a>,
    <a key="b" href="#bass" className={getLinkClass(instruments.bass)}>
      B
    </a>,
    <a key="k" href="#keys" className={getLinkClass(instruments.Keys)}>
      K
    </a>,
    <a key="d" href="#drums" className={getLinkClass(instruments.Drums)}>
      D
    </a>,
    <a key="v" href="#voice" className={getLinkClass(instruments.Voice)}>
      V
    </a>,
  ];

  return (
    <span className="flex flex-row justify-between max-w-xs overflow-hidden text-ellipsis">
      {links.reduce((prev, curr) => [prev, " | ", curr])}
    </span>
  );
};

const renderProgression = (params) => {
  const value = params.value;

  return (
    <div className="w-full flex items-center justify-center h-[50px]">
      <div className="w-10/12 bg-gray-200 rounded-full h-5">
        <div
          className="bg-yellow-600 h-5 rounded text-center py-1 text-[8pt] leading-none text-white"
          style={{ width: `${value}%` }}
        >
          {value}%
        </div>
      </div>
    </div>
  );
};

const columns = [
  { field: "id", headerName: "ID", width: 90 },
  {
    field: "Song",
    headerName: "Song",
    flex: 2,
  },
  {
    field: "Artist",
    headerName: "Artist",
    flex: 2,
  },
  {
    field: "Progression",
    headerName: "Progression",
    type: "number",
    flex: 2,
    renderCell: renderProgression,
  },
  {
    field: "Instruments",
    headerName: "Instruments",
    description: "This column has a value getter and is not sortable.",
    sortable: false,
    flex: 2.1,
    renderCell: formatInstruments,
  },
];

export default function DashboardList() {
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    const handleResize = () => {
      const newPageSize = Math.floor((window.innerHeight - 100) / 52); // Ajustar 100 e 52 conforme necessário
      setPageSize(newPageSize);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <Box className="h-screen w-full sm:w-11/12 md:w-10/12 lg:w-9/12 xl:w-8/12 mx-auto cursor-pointer">
      <DataGrid
        rows={FAKEDATA}
        columns={columns}
        pageSize={pageSize}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        rowsPerPageOptions={[5, 10, 20, 50, 100]}
        pagination
        // checkboxSelection
        disableRowSelectionOnClick
        className="w-full"
      />
    </Box>
  );
}
