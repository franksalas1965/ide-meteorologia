"use client";
import { useState } from "react";
import { Box, Typography, Select, MenuItem, Grid } from "@mui/material";
import { BarChart, LineChart, PieChart } from "@mui/x-charts";

import type {
  BarSeriesType,
  LineSeriesType,
  PieSeriesType,
  PieValueType,
} from "@mui/x-charts/models";

type ChartType = "bar" | "line" | "pie"; // Elimina los otros tipos si no son necesarios

interface ChartsViewerProps {
  chartType?: ChartType;
  initialChartType?: ChartType;
  initialTimeRange?: "week" | "month" | "year";
}

export default function ChartsViewer({
  initialChartType = "bar",
  initialTimeRange = "year",
}: ChartsViewerProps) {
  const [chartType, setChartType] = useState<ChartType>(initialChartType);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
    initialTimeRange
  );

  // Datos de ejemplo con tipos correctos
  const barData = {
    xAxis: [
      {
        data: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
        scaleType: "band" as const,
        id: "x-axis-bar",
      },
    ],
    series: [
      {
        data: [35, 44, 24, 58, 49, 62],
        type: "bar" as const,
        label: "Rendimiento",
        id: "series-bar",
      } as BarSeriesType,
    ],
    height: 300,
  };

  const lineData = {
    xAxis: [
      {
        data: [1, 2, 3, 4, 5, 6],
        id: "x-axis-line",
      },
    ],
    series: [
      {
        data: [35, 44, 24, 58, 49, 62],
        area: true,
        type: "line" as const,
        label: "Tendencia",
        id: "series-line",
      } as LineSeriesType,
    ],
    height: 300,
  };

  const pieData = {
    series: [
      {
        data: [
          { id: 0, value: 35, label: "Maíz" },
          { id: 1, value: 25, label: "Soja" },
          { id: 2, value: 20, label: "Trigo" },
          { id: 3, value: 20, label: "Girasol" },
        ],
        type: "pie" as const,
        arcLabel: (item: PieValueType) => `${item.label} (${item.value}%)`,
        id: "series-pie",
      } as PieSeriesType,
    ],
    height: 300,
  };

  const handleChartTypeChange = (value: string) => {
    setChartType(value as "bar" | "line" | "pie");
  };

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value as "week" | "month" | "year");
  };



  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        p: 2,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Análisis Gráfico
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Select
          value={chartType}
          onChange={(e) => handleChartTypeChange(e.target.value)}
          size="small"
        >
          <MenuItem value="bar">Barras</MenuItem>
          <MenuItem value="line">Líneas</MenuItem>
          <MenuItem value="pie">Torta</MenuItem>
        </Select>

        <Select
          value={timeRange}
          onChange={(e) => handleTimeRangeChange(e.target.value)}
          size="small"
        >
          <MenuItem value="week">Semanal</MenuItem>
          <MenuItem value="month">Mensual</MenuItem>
          <MenuItem value="year">Anual</MenuItem>
        </Select>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Grid container spacing={2} sx={{ flex: 1 }}>
          <Grid >
            <Box
              sx={{
                p: 2,
                border: "1px solid #ddd",
                borderRadius: 1,
                height: "80%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="subtitle1" gutterBottom>
                Rendimiento por cultivo
              </Typography>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                {chartType === "bar" && <BarChart {...barData} />}
                {chartType === "line" && <LineChart {...lineData} />}
              
              </Box>
            </Box>
          </Grid>

          <Grid >
            <Box
              sx={{
                p: 2,
                border: "1px solid #ddd",
                borderRadius: 1,
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography variant="subtitle1" gutterBottom>
                Otra métrica
              </Typography>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <BarChart {...barData} />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

