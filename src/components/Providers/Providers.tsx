'use client';
import { useDarkTheme } from '@/store/darkTheme';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme } from 'antd';
import React, { useState } from 'react';

interface ProvidersProps {
    children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
    const { darkTheme } = useDarkTheme();
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <AntdRegistry>
                <ConfigProvider
                    theme={{
                        algorithm: darkTheme ? theme.darkAlgorithm : theme.defaultAlgorithm,
                        components: {
                            Layout: {
                                headerBg: `${darkTheme ? '#0055ff' : '#e0e0e0'}`,
                                bodyBg: `${darkTheme ? '#292a2d' : 'rgb(254,248,239)'}`,
                                colorFillContent: `${darkTheme ? '#292a2d' : '#e0e0e0'}`
                            },
                            Menu: {
                                itemBg: ''
                            }
                        }
                    }}
                >
                    {children}
                </ConfigProvider>
            </AntdRegistry>
        </QueryClientProvider>
    );
};
export default Providers;
