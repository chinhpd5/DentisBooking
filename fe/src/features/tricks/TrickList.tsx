import { Button, Col, Form, Input, Popconfirm, Row, Select, Space, Table, Tag } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { getListTrick, deleteTrick } from "../../services/trick";
import { TRICK_STATUS } from "../../contants";
import toast from "react-hot-toast";
import { useState } from "react";
import { Link } from "react-router-dom";
import ITrick from "../../types/trick";
import IData from "../../types";
import { IStaff } from "../../types/staff";

const { Option } = Select;

type FilterType = {
  currentPage: number;
  pageSize: number;
  search?: string | undefined;
  status?: TRICK_STATUS | undefined;
};

function TrickList() {
  const [form] = Form.useForm();
  const [filter, setFilter] = useState<FilterType>({
    currentPage: 1,
    pageSize: 10,
  });

  const { data, isLoading, error } = useQuery<IData<ITrick>>({
    queryKey: ["tricks", filter],
    queryFn: () =>
      getListTrick(filter.currentPage, filter.pageSize, filter.search, filter.status),
    placeholderData: (prev) => prev,
  });


  if (error) {
    toast.error(error.message);
  }

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteTrick,
    onSuccess: () => {
      toast.success("Xóa thành công");
      queryClient.invalidateQueries({ queryKey: ["tricks"] });
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
    if (hours)
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
      title: "Tên thủ thuật",
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
      title: "Bác sĩ",
      dataIndex: ["staffIds", "name"],
      key: "staffIds",
      width: 150,
      ellipsis: true,
      responsive: ["md"] as ("xs" | "sm" | "md" | "lg" | "xl" | "xxl")[],
      render: (_: unknown, record: ITrick) => {
        const staff = typeof record.staffIds === 'object' ? record.staffIds : null;
        return staff ? staff.map((staff: IStaff) => staff.name).join(", ") : "-";
      },
    },
    {
      title: "Số lượng KTV đi kèm",
      dataIndex: "countStaff",
      key: "countStaff",
      width: 120,
      align: "center" as const,
      responsive: ["lg"] as ("xs" | "sm" | "md" | "lg" | "xl" | "xxl")[],
    },
    {
      title: "Số lượng Công việc chuẩn bị",
      dataIndex: "jobIds",
      key: "jobIds",
      width: 150,
      align: "center" as const,
      responsive: ["lg"] as ("xs" | "sm" | "md" | "lg" | "xl" | "xxl")[],
      render: (jobIds: unknown[]) => jobIds?.length || 0,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: TRICK_STATUS) => (
        <Tag color={status === TRICK_STATUS.ACTIVE ? "green" : "red"}>
          {status === TRICK_STATUS.ACTIVE ? "Hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 120,
      // fixed: "right" as const,
      render: (_: unknown, item: ITrick) => (
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
      <h3>Danh sách thủ thuật</h3>
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Row gutter={[8, 8]}>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Form.Item name="search" label="Tìm kiếm">
              <Input placeholder="Tên thủ thuật" allowClear />
            </Form.Item>
          </Col>
          <Col xs={12} sm={12} md={6} lg={6}>
            <Form.Item name="status" label="Trạng thái">
              <Select allowClear placeholder="Chọn trạng thái">
                <Option value={TRICK_STATUS.ACTIVE}>Hoạt động</Option>
                <Option value={TRICK_STATUS.DISABLED}>Không hoạt động</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={12} lg={12} style={{ display: "flex", alignItems: "flex-end", paddingBottom: 4 }}>
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

export default TrickList;

