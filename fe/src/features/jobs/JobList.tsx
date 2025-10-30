import { Button, Col, Form, Input, Popconfirm, Row, Select, Space, Table, Tag } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { getListJob, deleteJob } from "../../services/job";
import { JOB_STATUS } from "../../contants";
import toast from "react-hot-toast";
import { useState } from "react";
import { Link } from "react-router-dom";
import IJob from "../../types/job";
import IData from "../../types";

const { Option } = Select;

type FilterType = {
  currentPage: number;
  pageSize: number;
  search?: string | undefined;
  status?: JOB_STATUS | undefined;
};

function JobList() {
  const [form] = Form.useForm();
  const [filter, setFilter] = useState<FilterType>({
    currentPage: 1,
    pageSize: 10,
  });

  const { data, isLoading, error } = useQuery<IData<IJob>>({
    queryKey: ["jobs", filter],
    queryFn: () =>
      getListJob(filter.currentPage, filter.pageSize, filter.search, filter.status),
    placeholderData: (prev) => prev,
  });

  if (error) {
    toast.error(error.message);
  }

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      toast.success("Xóa thành công");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error as { message?: string };
      toast.error("Xóa thất bại: " + errorMessage.message);
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleFinish = (values: FilterType) => {
    setFilter({
      currentPage: 1,
      pageSize: 10,
      search: values.search || undefined,
      status: values.status ?? undefined,
    });
  };

  const handleReset = () => {
    form.resetFields();
    setFilter({
      currentPage: 1,
      pageSize: 10,
      search: undefined,
      status: undefined,
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if(hours)
      return `${hours.toString().padStart(2, "0")} giờ:${minutes.toString().padStart(2, "0")} phút`;
    else
      return `${minutes.toString().padStart(2, "0")} phút`;
  };

  const columns = [
    {
      title: "STT",
      render: (_: unknown, __: unknown, index: number) =>
        (filter.currentPage - 1) * filter.pageSize + index + 1,
      width: 70,
    },
    {
      title: "Tên công việc",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
      render: (time: number) => formatTime(time),
    },
    {
      title: "Cần thực hiện trước thủ thuật",
      dataIndex: "isFrist",
      key: "isFrist",
      render: (isFrist: boolean) => (
        <Tag color={isFrist ? "blue" : "default"}>
          {isFrist ? "Có" : "Không"}
        </Tag>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: JOB_STATUS) => (
        <Tag color={status === JOB_STATUS.ACTIVE ? "green" : "red"}>
          {status === JOB_STATUS.ACTIVE ? "Hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_: unknown, item: IJob) => (
        <Space>
          <Link to={`detail/${item._id}`}>
            <Button icon={<InfoCircleOutlined />} />
          </Link>
          <Link to={`edit/${item._id}`}>
            <Button icon={<EditOutlined />} />
          </Link>
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa công việc này không?"
            onConfirm={() => handleDelete(item._id)}
            okText="Xóa"
            cancelText="Hủy"
            icon={<QuestionCircleOutlined style={{ color: "red" }} />}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h3>Danh sách công việc KTV</h3>
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="search" label="Tìm kiếm">
              <Input placeholder="Tên công việc hoặc mô tả" allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="status" label="Trạng thái">
              <Select allowClear placeholder="Chọn trạng thái">
                <Option value={JOB_STATUS.ACTIVE}>Hoạt động</Option>
                <Option value={JOB_STATUS.DISABLED}>Không hoạt động</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={4} style={{ display: "flex", alignItems: "flex-end" }}>
            <Form.Item>
              <Button htmlType="submit" type="primary" icon={<SearchOutlined />}>
                Lọc
              </Button>
              <Button onClick={handleReset} style={{ marginLeft: 8 }}>
                Đặt lại
              </Button>
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

export default JobList;

