import { Button, Col, Form, Input, Popconfirm, Row, Select, Space, Table, Tag } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { getListJob, deleteJob } from "../../services/job";
import { JOB_STATUS } from "../../contants";
import toast from "react-hot-toast";
import { useState } from "react";
import React from "react";
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
    // onError: (error: unknown) => {
    //   const errorMessage = error as { message?: string };
    //   toast.error("Xóa thất bại: " + errorMessage.message);
    // },
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
      width: 60,
    },
    {
      title: "Tên công việc",
      dataIndex: "name",
      key: "name",
      width: 180,
      ellipsis: true,
    },
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
      width: 120,
      render: (time: number) => formatTime(time),
    },
    {
      title: "Cần thực hiện trước thủ thuật",
      dataIndex: "isFirst",
      key: "isFirst",
      width: 180,
      align: "center" as const,
      responsive: ["md"] as ("xs" | "sm" | "md" | "lg" | "xl" | "xxl")[],
      render: (isFirst: boolean) => (
        <Tag color={isFirst ? "blue" : "default"}>
          {isFirst ? "Có" : "Không"}
        </Tag>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: 200,
      ellipsis: true,
      responsive: ["lg"] as ("xs" | "sm" | "md" | "lg" | "xl" | "xxl")[],
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: JOB_STATUS) => (
        <Tag color={status === JOB_STATUS.ACTIVE ? "green" : "red"}>
          {status === JOB_STATUS.ACTIVE ? "Hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 120,
      // fixed: "right" as const,
      render: (_: unknown, item: IJob) => (
        <Space size="small">
          <Link to={`detail/${item._id}`}>
            <Button
              color="blue"
              variant="solid"
              icon={<EyeOutlined />}
              size="small"
            ></Button>
          </Link>
          <Link to={`edit/${item._id}`}>
            <Button
              color="orange"
              variant="solid"
              icon={<EditOutlined />}
              size="small"
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
                size="small"
              ></Button>
          </Popconfirm>
        </Space>
      ),
    },
    
  ];

  return (
    <div>
      <h3>Danh sách công việc KTV</h3>
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Row gutter={[8, 8]}>
          <Col xs={12} sm={12} md={8} lg={8}>
            <Form.Item name="search" label="Tìm kiếm">
              <Input placeholder="Tên công việc hoặc mô tả" allowClear />
            </Form.Item>
          </Col>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Form.Item name="status" label="Trạng thái">
              <Select allowClear placeholder="Chọn trạng thái">
                <Option value={JOB_STATUS.ACTIVE}>Hoạt động</Option>
                <Option value={JOB_STATUS.DISABLED}>Không hoạt động</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={10} lg={10} style={{ display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>
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

      <div style={{ overflowX: "auto" }}>
        <Table
          columns={columns}
          loading={isLoading}
          dataSource={data?.data.map((item) => ({ ...item, key: item._id }))}
          scroll={{ x: "max-content" }}
          size="small"
          pagination={{
            current: filter.currentPage,
            pageSize: filter.pageSize,
            total: data?.totalDocs,
            onChange: (page, pageSize) =>
              setFilter((prev) => ({ ...prev, currentPage: page, pageSize })),
            responsive: true,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total}`,
          }}
          components={{
            body: {
              row: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
                <tr {...props} style={{ height: '60px' }} />
              ),
            },
          }}
        />
      </div>
    </div>
  );
}

export default JobList;

