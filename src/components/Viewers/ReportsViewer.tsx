"use client";
import { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

interface Report {
  id: string;
  title: string;
  date: string;
  type: string;
  status: string;
}

export default function ReportsViewer() {
  const [tabValue, setTabValue] = useState(0);
  const [reports, setReports] = useState<Report[]>([
    {
      id: "1",
      title: "Reporte de productividad 2023",
      date: "15/03/2023",
      type: "Anual",
      status: "Completado",
    },
    {
      id: "2",
      title: "Análisis de suelo - Lote 5",
      date: "22/06/2023",
      type: "Parcela",
      status: "Pendiente",
    },
    {
      id: "3",
      title: "Rendimiento por cultivo",
      date: "10/01/2023",
      type: "Comparativo",
      status: "Completado",
    },
  ]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: "100%", height: "100%", p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Generador de Reportes
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange}>
        <Tab label="Mis Reportes" />
        <Tab label="Plantillas" />
        <Tab label="Nuevo Reporte" />
      </Tabs>

      <Box sx={{ mt: 2 }}>
        {tabValue === 0 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.title}</TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell>{report.type}</TableCell>
                    <TableCell>{report.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tabValue === 1 && (
          <Box>
            <Typography>Seleccione una plantilla:</Typography>
            {/* Aquí irían las plantillas de reportes */}
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography>Crear nuevo reporte:</Typography>
            {/* Aquí iría el formulario para nuevos reportes */}
          </Box>
        )}
      </Box>
    </Box>
  );
}
