import {
  AreaChartOutlined,
  HomeOutlined,
  InsertRowBelowOutlined,
  PlusOutlined,
  PushpinOutlined,
  ScheduleOutlined,
  ScissorOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UserAddOutlined,
  UsergroupAddOutlined,
  UserOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Button, Menu, Popconfirm } from "antd";
import logoImage from "../assets/logo.jpg";
import "../assets/layout.css";
import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";

type MenuItem = Required<MenuProps>["items"][number];

const items: MenuItem[] = [
  {
    key: "home",
    label: "Trang chủ",
    icon: <HomeOutlined />,
  },
  {
    key: "booking",
    label: "Quản lý đặt lịch",
    icon: <ScheduleOutlined />,
    children: [
      {key: "booking-list", label: "Danh sách Đặt lịch", icon: <UnorderedListOutlined />},
      {key: "booking-add", label: "Thêm mới Đặt lịch", icon: <PlusOutlined />}
    ]
  },
  {
    key: "staff",
    label: "Quản lý Bác sỹ/KTV",
    icon: <TeamOutlined />,
    children: [
      {key: "staff-list", label: "Danh sách Bác sỹ/KTV", icon: <UnorderedListOutlined />},
      {key: "staff-add", label: "Thêm mới Bác sỹ/KTV", icon: <PlusOutlined />}
    ]
  },
  {
    key: "trick",
    label: "Quản lý Thủ thuật",
    icon: <ScissorOutlined />,
    children: [
      {key: "trick-list", label: "Danh sách Thủ thuật", icon: <UnorderedListOutlined />},
      {key: "trick-add", label: "Thêm mới Thủ thuật", icon: <PlusOutlined />}
    ]
  },
  {
    key: "job",
    label: "Quản lý Công việc KTV",
    icon: <PushpinOutlined />,
    children: [
      {key: "job-list", label: "Danh sách Công việc KTV", icon: <UnorderedListOutlined />},
      {key: "job-add", label: "Thêm mới Công việc KTV", icon: <PlusOutlined />}
    ]
  },
  {
    key: "seat",
    label: "Quản lý Ghế",
    icon: <InsertRowBelowOutlined />,
    children: [
      {key: "seat-list", label: "Danh sách Ghế", icon: <UnorderedListOutlined />},
      {key: "seat-add", label: "Thêm mới Ghế", icon: <PlusOutlined />},
      {key: "location-list", label: "Quản lý tầng", icon: <UnorderedListOutlined />},
    ]
  },
  {
    key: "dashboard",
    label: "Báo cáo",
    icon: <AreaChartOutlined />,
  },
  {
    key: "user",
    label: "Quản lý Tài khoản",
    icon: <UsergroupAddOutlined />,
    children: [
      {key: "user-list", label: "Danh sách Tài khoản", icon: <UnorderedListOutlined />},
      {key: "user-add", label: "Thêm mới Tài khoản", icon: <PlusOutlined />}
    ]
  },
  {
    key: "Customer",
    label: "Quản lý Khách hàng",
    icon: <UserSwitchOutlined />,
    children: [
      {key: "customer-list", label: "Danh sách Khách hàng", icon: <UserOutlined />},
      {key: "customer-add", label: "Thêm mới Khách hàng", icon: <UserAddOutlined />}
    ]
  },
];

function MainLayout() {
  const naviagte = useNavigate()

  const onClick: MenuProps["onClick"] = (e) => {
    if(e.key){
      switch(e.key){
        case 'user-list':
          naviagte('/user');
          break;
        case 'user-add':
          naviagte('/user/add');
          break;
        case 'staff-list':
          naviagte('/staff');
          break;
        case 'staff-add':
          naviagte('/staff/add');
          break;
        case 'job-list':
          naviagte('/job')
          break;
        case 'job-add':
          naviagte('/job/add')
          break;
        case 'trick-list':
          naviagte('/trick')
          break;
        case 'trick-add':
          naviagte('/trick/add')
          break;
        case 'location-list':
          naviagte('/location')
          break;
        case 'seat-list':
          naviagte('/seat')
          break;
        case 'seat-add':
          naviagte('/seat/add')
          break;
        case 'customer-list':
          naviagte('/customer')
          break;
        case 'customer-add':
          naviagte('/customer/add')
          break;
        case 'booking-list':
          naviagte('/booking')
          break;
        case 'booking-add':
          naviagte('/booking/add')
          break;
        case 'home':
          naviagte('/')
          break;
    }
    }else{
      naviagte('not-found')
    }
  };

  const handleLogout = () => {

  }

  return (
    <div className="wrapper">
      <aside  className="sidebar">
        <div className="branding">
          <img src={logoImage} alt="logo" className="logo" />
          <h3 className="title">Đặt lịch Xiêm Anh</h3>
        </div>
        <Menu
          onClick={onClick}
          style={{ width: 250 }}
          defaultSelectedKeys={["1"]}
          defaultOpenKeys={["sub1"]}
          mode="inline"
          theme="dark"
          items={items}
        />
      </aside >

      <div className="main">
        <header className="header">
          <div>
            <h3>Xin chào, Admin</h3>
          </div>

          <Popconfirm
            placement="bottom"
            title="Đăng xuất"
            description="Bạn có chắc chắn muốn đăng xuất"
            onConfirm={handleLogout}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small">Đăng xuất</Button>
          </Popconfirm>
         
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
     
    </div>
  );
}

export default MainLayout;
