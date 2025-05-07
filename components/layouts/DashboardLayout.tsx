'use client';

import { ReactNode, useState } from 'react';
import { Layout, Menu, Breadcrumb, Button, Avatar, Typography, Dropdown } from 'antd';
import Link from 'next/link';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  ScheduleOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  BankOutlined,
  SettingOutlined,
  LogoutOutlined,
  DollarOutlined,
  FileTextOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface BreadcrumbItem {
  title: string;
  href: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  icon?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default function DashboardLayout({ 
  children, 
  title,
  icon = <DashboardOutlined />,
  breadcrumbs = []
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: <Link href="/dashboard">Dashboard</Link>,
    },
    {
      key: 'appointments',
      icon: <ScheduleOutlined />,
      label: <Link href="/appointments">Agendamentos</Link>,
    },
    {
      key: 'patients',
      icon: <TeamOutlined />,
      label: <Link href="/patients">Pacientes</Link>,
    },
    {
      key: 'professionals',
      icon: <MedicineBoxOutlined />,
      label: <Link href="/professionals">Profissionais</Link>,
    },
    {
      key: 'clinics',
      icon: <BankOutlined />,
      label: <Link href="/clinics">Clínicas</Link>,
    },
    {
      key: 'billing',
      icon: <DollarOutlined />,
      label: 'Financeiro',
      children: [
        {
          key: 'billing-rules',
          label: <Link href="/billing/rules">Regras de Faturamento</Link>,
        },
        {
          key: 'billing-invoices',
          label: <Link href="/billing/invoices">Faturas</Link>,
        },
        {
          key: 'billing-reports',
          label: <Link href="/billing/reports">Relatórios</Link>,
        },
      ],
    },
    {
      key: 'documents',
      icon: <FileTextOutlined />,
      label: <Link href="/documents">Documentos</Link>,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configurações',
      children: [
        {
          key: 'settings-profile',
          label: <Link href="/settings/profile">Perfil</Link>,
        },
        {
          key: 'settings-privacy',
          label: <Link href="/settings/privacy">Privacidade</Link>,
        },
        {
          key: 'settings-notifications',
          label: <Link href="/settings/notifications">Notificações</Link>,
        },
      ],
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Meu Perfil',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configurações',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sair',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={250}
        theme="light"
        style={{
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          zIndex: 1,
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '16px',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <img 
            src="/logo.svg" 
            alt="Logo" 
            style={{ 
              height: '32px',
              marginRight: collapsed ? '0' : '8px'
            }} 
          />
          {!collapsed && <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Medical System</span>}
        </div>
        
        <Menu
          mode="inline"
          defaultSelectedKeys={['dashboard']}
          style={{ height: '100%', borderRight: 0 }}
          items={menuItems}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          padding: '0 16px', 
          background: '#fff', 
          display: 'flex', 
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
          
          <div style={{ flex: 1 }}></div>
          
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <span style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Avatar icon={<UserOutlined />} />
              <span style={{ marginLeft: '8px' }}>John Doe</span>
            </span>
          </Dropdown>
        </Header>
        
        <div style={{ 
          padding: '16px 24px 0',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ marginRight: '8px', fontSize: '24px' }}>{icon}</span>
            <Title level={3} style={{ margin: 0 }}>{title}</Title>
          </div>
          
          {breadcrumbs.length > 0 && (
            <Breadcrumb style={{ marginBottom: '16px' }}>
              {breadcrumbs.map((item, index) => (
                <Breadcrumb.Item key={index}>
                  {item.href ? <Link href={item.href}>{item.title}</Link> : item.title}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          )}
        </div>
        
        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          minHeight: 280,
          background: '#fff',
          borderRadius: '4px',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
} 