  import { Button, Col, Form, Input, Popconfirm, Row, Space, Table } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { getListLocation, deleteLocation } from "../../services/location";
import toast from "react-hot-toast";
import { useState } from "react";
import { Link } from "react-router-dom";
import ILocation from "../../types/location";

type FilterType = {
  search?: string | undefined;
};

function LocationList() {
  const [form] = Form.useForm();
  const [filter, setFilter] = useState<FilterType>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["locations", filter],
    queryFn: () => getListLocation(),
    placeholderData: (prev) => prev,
  });

  if (error) {
    toast.error((error as Error).message);
  }

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      toast.success("Xóa thành công");
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
    // onError: (error: unknown) => {
    //   const err = error as { response?: { data?: { message?: string } } };
    //   toast.error("Xóa thất bại: " + err.response?.data?.message || "Lỗi không xác định");
    // },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleFinish = (values: FilterType) => {
    setFilter({
      search: values.search || undefined,
    });
  };

  const handleReset = () => {
    form.resetFields();
    setFilter({});
  };

  // Filter data based on search term
  const filteredData = data?.data?.filter((location: ILocation) => {
    if (!filter.search) return true;
    const searchLower = filter.search.toLowerCase();
    return (
      location.name.toLowerCase().includes(searchLower) ||
      (location.description?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  const columns = [
    {
      title: "STT",
      render: (_: unknown, __: unknown, index: number) => index + 1,
      width: 70,
    },
    {
      title: "Tên tầng",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "",
      key: "actions",
      render: (_: unknown, item: ILocation) => (
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
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h3>Danh sách tầng</h3>
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
              <Input placeholder="Tên tầng hoặc mô tả" allowClear />
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
        dataSource={filteredData?.map((item: ILocation) => ({ ...item, key: item._id }))}
        pagination={false}
      />
    </div>
  );
}

export default LocationList;

