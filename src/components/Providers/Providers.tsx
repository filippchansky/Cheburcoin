'use client';
import { useDarkTheme } from '@/store/darkTheme';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme } from 'antd';
import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useFavoriteCoins } from '@/store/FavoriteCoins';
import { auth, db } from '../../../configs/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const { addCoins } = useFavoriteCoins();
  const { darkTheme } = useDarkTheme();
  const darkThemeMui = createTheme({
    palette: {
      mode: darkTheme ? 'dark' : 'light'
    }
  });
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    addCoins();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AntdRegistry>
        <ThemeProvider theme={darkThemeMui}>
          <CssBaseline />
          <ConfigProvider
            theme={{
              algorithm: darkTheme ? theme.darkAlgorithm : theme.defaultAlgorithm,
              components: {
                Layout: {
                  headerBg: `${darkTheme ? 'rgb(27 28 30)' : '#e0e0e0'}`,
                  bodyBg: `${darkTheme ? 'rgb(51,51,51)' : 'rgb(254,248,239)'}`,
                  colorFillContent: `${darkTheme ? 'rgb(51,51,51)' : '#e0e0e0'}`
                },
                Menu: {
                  itemBg: ''
                }
              }
            }}
          >
            {children}
          </ConfigProvider>
        </ThemeProvider>
      </AntdRegistry>
    </QueryClientProvider>
  );
};
export default Providers;
