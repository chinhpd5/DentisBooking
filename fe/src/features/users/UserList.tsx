import { Button, Col, Form, Input, Popconfirm, Row, Select, Space, Table, Tag } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DeleteOutlined, EditOutlined, InfoCircleOutlined, QuestionCircleOutlined, SearchOutlined } from "@ant-design/icons";
import { getListUser, deleteUser } from "../../services/user";
import { USER_STATUS, USER_ROLE } from "../../contants";
import toast from "react-hot-toast";
import { useState } from "react";
import { Link } from "react-router-dom";
import IUser from "../../types/user";
import IData from "../../types";
import { convertNameRole, convertNameRoleArray } from "../../utils/helper";

const { Option } = Select;
const dataRole = convertNameRoleArray();

type FilterType = {
  currentPage: number;
  pageSize: number;
  search?: string|undefined;
  role?: USER_ROLE|undefined;
  status?: USER_STATUS| undefined;
};

function UserList() {
  const [form] = Form.useForm();
  const [filter, setFilter] = useState<FilterType>({
    currentPage: 1,
    pageSize: 10,
  });

  const { data, isLoading, error } = useQuery<IData<IUser>>({
    queryKey: ["users", filter],
    queryFn: () =>
      getListUser(filter.currentPage, filter.pageSize, filter.search, filter.role, filter.status),
    placeholderData: (prev) => prev,
  });
  if(error){
    toast.error(error.message)
  }

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success("Xóa thành công");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
   
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleFinish = (values: any) => {
    // Get current form values to ensure we capture all fields
    const formValues = form.getFieldsValue();
    const allValues = { ...formValues, ...values };
    
    setFilter({
      currentPage: 1,
      pageSize: 10,
      search: allValues.search || undefined,
      role: allValues.role !== undefined && allValues.role !== null && allValues.role !== "" ? allValues.role : undefined,
      status: allValues.status !== undefined && allValues.status !== null && allValues.status !== "" ? allValues.status : undefined,
    });
  };

  const handleReset = () => {
    form.resetFields();
    setFilter({
      currentPage: 1,
      pageSize: 10,
      search: undefined,
      role: undefined,
      status: undefined,
    });
  };

  const columns = [
    {
      title: "STT",
      render: (_: any, __: any, index: number) =>
        (filter.currentPage - 1) * filter.pageSize + index + 1,
      width: 70,
    },
    { title: "Họ tên", dataIndex: "name" },
    { title: "Username", dataIndex: "username" },
    { title: "Vai trò", dataIndex: "role", render: (role: USER_ROLE) => convertNameRole(role) },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: USER_STATUS) => (
        <Tag color={status === USER_STATUS.ACTIVE ? "green" : "red"}>
          {status === USER_STATUS.ACTIVE ? "Hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_: any, item: IUser) => (
        <Space size="middle">
          <Link to={`detail/${item._id}`}>
            <Button
              color="blue"
              variant="solid"
              icon={<InfoCircleOutlined />}
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

  return (
    <div>
      <h3>Danh sách người dùng</h3>
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="search" label="Tìm kiếm">
              <Input placeholder="Tên hoặc username" allowClear />
            </Form.Item>
          </Col>
         <Col span={6}>
            <Form.Item name="role" label="Vai trò">
              <Select placeholder="Chọn vai trò" allowClear>
                {
                  dataRole.map(item => {
                    return <Option key={item.value} value={item.value}>{convertNameRole(item.value)}</Option>
                  })
                }
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="status" label="Trạng thái">
              <Select allowClear placeholder="Chọn trạng thái">
                <Option value={USER_STATUS.ACTIVE}>Hoạt động</Option>
                <Option value={USER_STATUS.DISABLED}>Không hoạt động</Option>
              </Select>
            </Form.Item>
          </Col>
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

      <Table
        columns={columns}
        loading={isLoading}
        dataSource={data?.data.map((item) => ({ ...item, key: item._id }))}
        pagination={{
          current: filter.currentPage,
          pageSize: filter.pageSize,
          total: data?.totalDocs,
          onChange: (page, pageSize) =>
            setFilter((prev) => ({ ...prev, currentPage: page, pageSize })),
        }}
      />
    </div>
  );
}

export default UserList;
