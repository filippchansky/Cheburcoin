'use client';
import { useDarkTheme } from '@/store/darkTheme';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { ConfigProvider, theme } from 'antd';
import React, { useState } from 'react';
import { getPalette } from '@/theme/palette';

interface ProvidersProps {
    children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
    const { darkTheme } = useDarkTheme();
    const [queryClient] = useState(() => new QueryClient());
    const palette = getPalette(darkTheme);

    return (
        <NuqsAdapter>
            <QueryClientProvider client={queryClient}>
                <AntdRegistry>
                <ConfigProvider
                    theme={{
                        algorithm: darkTheme ? theme.darkAlgorithm : theme.defaultAlgorithm,
                        token: {
                            colorPrimary: palette.primary,
                            colorLink: palette.primary,
                            colorLinkHover: palette.primary,
                            colorBgLayout: palette.layoutBg,
                            borderRadius: 10,
                            fontSize: 15
                        },
                        components: {
                            Layout: {
                                headerBg: palette.headerBg,
                                bodyBg: palette.layoutBg
                            },
                            Menu: {
                                itemBg: 'transparent',
                                horizontalItemSelectedColor: palette.primary,
                                colorBgContainer: 'transparent'
                            },
                            Card: {
                                borderRadiusLG: 14
                            }
                        }
                    }}
                >
                    {children}
                </ConfigProvider>
            </AntdRegistry>
        </QueryClientProvider>
        </NuqsAdapter>
    );
};
export default Providers;
