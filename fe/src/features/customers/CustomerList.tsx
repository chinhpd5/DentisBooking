import { Button, Col, Form, Input, Popconfirm, Row, Space, Table } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DeleteOutlined, EditOutlined, InfoCircleOutlined, PlusOutlined, QuestionCircleOutlined, SearchOutlined } from "@ant-design/icons";
import { getListCustomer, deleteCustomer } from "../../services/customer";
import toast from "react-hot-toast";
import { useState } from "react";
import { Link } from "react-router-dom";
import ICustomer from "../../types/customer";
import IData from "../../types";

type FilterType = {
  currentPage: number;
  pageSize: number;
  search?: string | undefined;
};

function CustomerList() {
  const [form] = Form.useForm();
  const [filter, setFilter] = useState<FilterType>({
    currentPage: 1,
    pageSize: 10,
  });

  const { data, isLoading, error } = useQuery<IData<ICustomer>>({
    queryKey: ["customers", filter],
    queryFn: () =>
      getListCustomer(filter.currentPage, filter.pageSize, filter.search),
    placeholderData: (prev) => prev,
  });

  if (error) {
    toast.error((error as Error).message);
  }

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      toast.success("Xóa thành công");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    }
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleFinish = (values: FilterType) => {
    setFilter({
      currentPage: 1,
      pageSize: 10,
      search: values.search || undefined,
    });
  };

  const handleReset = () => {
    form.resetFields();
    setFilter({
      currentPage: 1,
      pageSize: 10,
      search: undefined,
    });
  };

  const columns = [
    {
      title: "STT",
      render: (_: ICustomer, __: ICustomer, index: number) =>
        (filter.currentPage - 1) * filter.pageSize + index + 1,
      width: 70,
    },
    { title: "Tên khách hàng", dataIndex: "name" },
    { title: "Số điện thoại", dataIndex: "phone" },
    { title: "Địa chỉ", dataIndex: "address" },
    { title: "Năm sinh", dataIndex: "yearOfBirth", 
      render: (yearOfBirth: number) => 
        yearOfBirth ? yearOfBirth : "-" },
    { title: "Giới tính", dataIndex: "gender", render: (gender: string) => gender === "male" ? "Nam" : gender === "female" ? "Nữ" : "Khác" },
    { title: "Ghi chú", dataIndex: "note" },
    {
      title: "",
      key: "actions",
      render: (_: ICustomer, item: ICustomer) => (
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
            onConfirm={() => handleDelete(item._id)}
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3>Danh sách khách hàng</h3>
        <Link to="add">
          <Button type="primary" icon={<PlusOutlined />}>
            Thêm mới
          </Button>
        </Link>
      </div>
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="search" label="Tìm kiếm">
              <Input placeholder="Tên, số điện thoại hoặc địa chỉ" allowClear />
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

export default CustomerList;

