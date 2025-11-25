import { Button, Col, Form, Input, Popconfirm, Row, Select, Space, Table, Tag } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
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
      width: 70,
    },
    {
      title: "Tên thủ thuật",
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
      title: "Bác sĩ",
      dataIndex: ["staffIds", "name"],
      key: "staffIds", 
      render: (_: unknown, record: ITrick) => {
        const staff = typeof record.staffIds === 'object' ? record.staffIds : null;
        return staff ? staff.map((staff: IStaff) => staff.name).join(", ") : "-";
      },
    },
    {
      title: "Số lượng KTV đi kèm",
      dataIndex: "countStaff",
      key: "countStaff",
    },
    {
      title: "Số lượng Công việc chuẩn bị",
      dataIndex: "jobIds",
      key: "jobIds",
      render: (jobIds: unknown[]) => jobIds?.length || 0,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: TRICK_STATUS) => (
        <Tag color={status === TRICK_STATUS.ACTIVE ? "green" : "red"}>
          {status === TRICK_STATUS.ACTIVE ? "Hoạt động" : "Không hoạt động"}
        </Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_: unknown, item: ITrick) => (
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
      <h3>Danh sách thủ thuật</h3>
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="search" label="Tìm kiếm">
              <Input placeholder="Tên thủ thuật" allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="status" label="Trạng thái">
              <Select allowClear placeholder="Chọn trạng thái">
                <Option value={TRICK_STATUS.ACTIVE}>Hoạt động</Option>
                <Option value={TRICK_STATUS.DISABLED}>Không hoạt động</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6} style={{ display: "flex", alignItems: "flex-end" }}>
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

export default TrickList;

