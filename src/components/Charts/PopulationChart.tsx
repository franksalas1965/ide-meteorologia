// components/Charts/PopulationChart.tsx
"use client";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Skeleton, Box, Typography } from "@mui/material";
import useSWR from "swr";

// Tipos de datos
export interface PopulationData {
  year: string;
  population: number;
  [key: string]: any; // Para propiedades adicionales
}

interface PopulationChartProps {
  apiUrl?: string; // URL para fetch de datos
  data?: PopulationData[]; // Datos opcionales (si no se usa apiUrl)
  title?: string;
  barColor?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const PopulationChart: React.FC<PopulationChartProps> = ({
  apiUrl,
  data: initialData,
  title = "Evolución de la Población",
  barColor = "#8884d8",
  height = 300,
  showLegend = true,
  showGrid = true,
}) => {
  // Fetch de datos si se proporciona apiUrl
  const {
    data: fetchedData,
    error,
    isLoading,
  } = useSWR<PopulationData[]>(apiUrl ? apiUrl : null, fetcher);

  // Decide qué datos usar
  const chartData = apiUrl ? fetchedData : initialData;

  // Manejo de estados
  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={height}
      >
        <Typography color="error">Error al cargar los datos</Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ width: "100%", height }}>
        <Skeleton variant="text" width="60%" height={30} sx={{ mx: "auto" }} />
        <Skeleton variant="rectangular" width="100%" height={height - 50} />
      </Box>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={height}
      >
        <Typography>No hay datos disponibles</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height }}>
      <Typography variant="h6" align="center" gutterBottom>
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={chartData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          {showLegend && <Legend />}
          <Bar
            dataKey="population"
            name="Población"
            fill={barColor}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default PopulationChart;
