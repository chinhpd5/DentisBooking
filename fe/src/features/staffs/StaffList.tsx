import { Button, Col, Row, Space, Spin, Table, Tag, Input, Select, Form, Popconfirm} from "antd";
import type { TableProps } from "antd";
import { IStaff } from "../../types/staff";
import { convertNameRole, convertNameRoleArray } from "../../utils/helper";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteStaff, getListStaff } from "../../services/staff";
import toast from "react-hot-toast";
import IData from "../../types";
import { Link } from "react-router-dom";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { STAFF_STATUS, USER_ROLE } from "../../contants";

const { Option } = Select;
const dataRole = convertNameRoleArray();

type FilterType = {
  currentPage: number,
  pageSize: number,
  search?: string|undefined,
  role?: USER_ROLE|undefined,
  status?: STAFF_STATUS|undefined
}

function StaffList() {
  const [form] = Form.useForm();
  const [filter, setFilter] = useState<FilterType>({
    currentPage: 1,
    pageSize: 10,
  })

  const columns: TableProps<IStaff>["columns"] = [
    {
      title: "STT",
      render: (_: unknown, __: unknown, index: number) =>
        (filter.currentPage - 1) * filter.pageSize + index + 1,
      width: 70,
    },
    {
      title: "Họ và tên",
      dataIndex: "name",
      key: "name",
      // render: (text) => <a>{text}</a>,
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role) => convertNameRole(role),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const color = status ? "green" : "red";
        return (
          <Tag color={color} key={status}>
            {status ? "Đang làm" : "Đã nghỉ"}
          </Tag>
        );
      },
    },
    {
      title: "",
      key: "action",
      render: (_, item) => (
        <Space size="middle">
          <Link to={`detail/${item._id}`}>
            <Button
              color="blue"
              variant="solid"
              icon={<EyeOutlined />}
            ></Button>
          </Link>
          <Link to={`edit/${item._id}`}>
            <Button
              color="orange"
              variant="solid"
              icon={<EditOutlined />}
            ></Button>
          </Link>
         
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa không?"
            onConfirm={() => confirm(item._id)}
            okText="Xác nhận"
            cancelText="Không"
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
          >
             <Button
                color="danger"
                variant="solid"
                icon={<DeleteOutlined />}
              ></Button>
          </Popconfirm>
        </Space>

      ),
    },
  ];

  const { data, isLoading, error } = useQuery<IData<IStaff>>({
    queryKey: ["staffs", filter.currentPage, filter.pageSize, filter.search, filter.role, filter.status],
    queryFn: () => getListStaff(filter.currentPage, filter.pageSize, filter.search, filter.role, filter.status),
    placeholderData: (prev) => prev,
  });
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      toast.success("Xóa thành công")
      queryClient.invalidateQueries({ queryKey: ["staffs"] });
    }
  });

  if (isLoading) {
    return <Spin />;
  }

  if (error) {
    toast.error(error.message);
  }

  const confirm = (id: string) => {
    if(id)
      deleteMutation.mutate(id)
  };


  const handleFinish = (values: Record<string, unknown>) => {

    const newFilter: FilterType = {
      currentPage: 1,
      pageSize: 10,
      search: values.search as string | undefined,
      role: values.role as USER_ROLE | undefined,
      status: values.status as STAFF_STATUS | undefined,
    };
    setFilter(newFilter);
  }

  const handleReset = () => {
    form.resetFields(); // reset input form
    setFilter({
      currentPage: 1,
      pageSize: 10,
      search: undefined,
      role: undefined,
      status: undefined,
    });
  }

  return (
    <div>
      <h3>Danh sách nhân viên</h3>

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          {/* Ô tìm kiếm */}
          <Col span={8}>
            <Form.Item name="search" label="Tìm kiếm">
              <Input placeholder="Nhập tên hoặc số điện thoại" allowClear />
            </Form.Item>
          </Col>

          {/* Ô chọn vai trò */}
          <Col span={6}>
            <Form.Item name="role" label="Vai trò">
              <Select placeholder="Chọn vai trò" allowClear>
                {
                  dataRole.map(item => {
                    return <Option value={item.value}>{item.name}</Option>
                  })
                }
              </Select>
            </Form.Item>
          </Col>

          {/* Ô chọn trạng thái */}
          <Col span={6}>
            <Form.Item name="status" label="Trạng thái">
              <Select placeholder="Chọn trạng thái" allowClear>
                <Option value={STAFF_STATUS.ACTIVE}>Đang làm</Option>
                <Option value={STAFF_STATUS.DISABLED}>Đã nghỉ</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Nút tìm kiếm */}
          <Col span={4} style={{ display: "flex", alignItems: "center", paddingTop: 28 }}>
            <Form.Item>
              <Space>
                <Button htmlType="submit" type="primary" icon={<SearchOutlined />}>
                  Lọc
                </Button>
                <Button onClick={handleReset}>
                  Đặt lại
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <Table<IStaff>
        columns={columns}
        dataSource={data?.data.map((item: IStaff) => {
          return { ...item, key: item._id };
        })}
        loading={isLoading}
        pagination={{
          current: data?.currentPage,
          pageSize: data?.limit,
          total: data?.totalDocs,
          onChange: (page, pageSize) => {
            
            // setFilter({...filter,currentPage: page});
            // setFilter({...filter,pageSize: pageSize});

            setFilter((prev) => ({
              ...prev,
              currentPage: page,
              pageSize: pageSize,
            }));
            
          },
        }}
      />
    </div>
  );
}

export default StaffList;
