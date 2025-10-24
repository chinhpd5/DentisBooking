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
  UsergroupAddOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Button, Menu, Popconfirm } from "antd";
import '../assets/layout.css';
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
  },
  {
    key: "dashboard",
    label: "Báo cáo",
    icon: <AreaChartOutlined />,
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
      {key: "seat-add", label: "Thêm mới Ghế", icon: <PlusOutlined />}
    ]
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
        <h3 className="title">Booking Dentis</h3>
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
