/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Box,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useRouter, usePathname } from "next/navigation";
import { getRuntimeConfig } from "@/utils/runtimeConfig";

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const pathname = usePathname();
  const [isHelpPage, setIsHelpPage] = useState(false);
  const [appTitle, setAppTitle] = useState("IDE-METEOROLOGIA");

  // Cargar configuración dinámica
  useEffect(() => {
    const config = getRuntimeConfig();
    setAppTitle(
      config.appTitle || process.env.NEXT_PUBLIC_TITULO || "IDE-METEOROLOGIA"
    );
  }, []);

  // Sincronizar el estado con la ruta actual
  useEffect(() => {
    setIsHelpPage(pathname === "/ayuda");
  }, [pathname]);

  const handleBannerClick = () => {
    router.push("/");
  };

  const handleHelpClick = () => {
    if (isHelpPage) {
      router.push("/");
    } else {
      router.push("/ayuda");
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: "transparent",
        boxShadow: "none",
        marginBottom: theme.spacing(2),
      }}
    >
      {/* Contenedor principal con banner de fondo */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "auto",
          overflow: "hidden",
          borderRadius: theme.shape.borderRadius,
        }}
      >
        {/* Imagen de banner */}
        <Box
          component="img"
          src="/images/banner.png"
          alt="Banner principal"
          sx={{
            width: "100%",
            height: isMobile ? "auto" : "50px",
            objectFit: "cover",
            cursor: "pointer",
            display: "block",
            marginTop: "0px",
          }}
          onClick={handleBannerClick}
        />

        {/* Barra de navegación */}
        <Box
          sx={{
            width: "100%",
            backgroundColor: "#056008FF",
            py: 0.1,
            marginTop: 0,
          }}
        >
          <Toolbar
            sx={{
              display: "flex",
              justifyContent: "space-between",
              color: "white",
              padding: theme.spacing(0, 2),
              minHeight: "40px !important",
            }}
          >
            <Typography
              variant="h6"
              component={Link}
              href="/"
              sx={{
                textDecoration: "none",
                color: "white",
                fontWeight: 600,
                fontSize: "1.2rem",
                textShadow: "1px 1px 3px rgba(0,0,0,0.8)",
                "&:hover": {
                  opacity: 0.9,
                },
              }}
            >
              {appTitle}
            </Typography>

            <Box sx={{ display: "flex", gap: 0.5 }}>
              {/* Botón Menú que controla el sidebar */}
              <Button
                color="inherit"
                onClick={(e) => {
                  e.preventDefault();
                  onMenuToggle();
                }}
                sx={{
                  fontWeight: 500,
                  textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                  fontSize: "0.875rem",
                  padding: "4px 8px",
                  minWidth: "auto",
                  "&:hover": {
                    backgroundColor: "rgba(5, 96, 8, 0.5)",
                  },
                }}
              >
                Menú
              </Button>

              {!isMobile && (
                <Button
                  color="inherit"
                  onClick={handleHelpClick}
                  sx={{
                    fontWeight: 500,
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                    fontSize: "0.875rem",
                    padding: "4px 8px",
                    minWidth: "auto",
                    "&:hover": {
                      backgroundColor: "rgba(5, 96, 8, 0.5)",
                    },
                  }}
                >
                  {isHelpPage ? "Cerrar Ayuda" : "Ayuda"}
                </Button>
              )}
            </Box>
          </Toolbar>
        </Box>
      </Box>
    </AppBar>
  );
};

export default Header;
