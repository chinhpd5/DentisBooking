import { Button, Card, Col, Form, Input, Modal, Pagination, Popconfirm, Row, Select, Space, Table, Tag } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { getListSeat, deleteSeat, updateSeatStatus } from "../../services/seat";
import { getListLocation } from "../../services/location";
import { SEAT_STATUS } from "../../contants";
import toast from "react-hot-toast";
import { useState } from "react";
import { Link } from "react-router-dom";
import ISeat from "../../types/seat";
import ILocation from "../../types/location";
import IData from "../../types";
import { getStatusBgColor, getStatusBorderColor, getStatusColor, getStatusText } from "../../utils/helper";

const { Option } = Select;

type FilterType = {
  currentPage: number;
  pageSize: number;
  search?: string | undefined;
  status?: SEAT_STATUS | undefined;
  location?: string | undefined;
};

type ViewMode = 'grid' | 'table';

function SeatList() {
  const [form] = Form.useForm();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterType>({
    currentPage: 1,
    pageSize: 10,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<ISeat | null>(null);
  const [newStatus, setNewStatus] = useState<number | null>(null);

  const { data: locationList } = useQuery({
    queryKey: ["locations"],
    queryFn: () => getListLocation(),
  });

  const { data, isLoading, error } = useQuery<IData<ISeat>>({
    queryKey: ["seats", filter],
    queryFn: () =>
      getListSeat(filter.currentPage, filter.pageSize, filter.search, filter.status, filter.location),
    placeholderData: (prev) => prev,
  });

  if (error) {
    toast.error((error as Error).message);
  }

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteSeat,
    onSuccess: () => {
      toast.success("Xóa thành công");
      queryClient.invalidateQueries({ queryKey: ["seats"] });
    },
    // onError: (error: unknown) => {
    //   const err = error as { response?: { data?: { message?: string } } };
    //   toast.error("Xóa thất bại: " + (err.response?.data?.message || "Lỗi không xác định"));
    // },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: number }) => updateSeatStatus(id, status),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công");
      queryClient.invalidateQueries({ queryKey: ["seats"] });
    },
    // onError: (error: unknown) => {
    //   const err = error as { response?: { data?: { message?: string } } };
    //   toast.error("Cập nhật trạng thái thất bại: " + (err.response?.data?.message || "Lỗi không xác định"));
    // },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleSeatClick = (seat: ISeat) => {
    // Chỉ cho phép click khi trạng thái là AVAILABLE hoặc USING
    if (seat.status !== SEAT_STATUS.AVAILABLE && seat.status !== SEAT_STATUS.USING) {
      return;
    }

    const calculatedNewStatus = seat.status === SEAT_STATUS.AVAILABLE 
      ? SEAT_STATUS.USING 
      : SEAT_STATUS.AVAILABLE;

    setSelectedSeat(seat);
    setNewStatus(calculatedNewStatus);
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    if (selectedSeat && newStatus !== null) {
      try {
        await updateStatusMutation.mutateAsync({ 
          id: selectedSeat._id, 
          status: newStatus 
        });
        setModalVisible(false);
        setSelectedSeat(null);
        setNewStatus(null);
      } catch (error) {
        console.error("Error updating seat status:", error);
      }
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setSelectedSeat(null);
    setNewStatus(null);
  };

  const handleFinish = (values: FilterType) => {
    setFilter({
      currentPage: 1,
      pageSize: 10,
      search: values.search || undefined,
      status: values.status ?? undefined,
      location: values.location || undefined,
    });
  };

  const handleReset = () => {
    form.resetFields();
    setFilter({
      currentPage: 1,
      pageSize: 10,
      search: undefined,
      status: undefined,
      location: undefined,
    });
  };

  

  const columns = [
    {
      title: "STT",
      render: (_: unknown, __: unknown, index: number) =>
        (filter.currentPage - 1) * filter.pageSize + index + 1,
      width: 70,
    },
    {
      title: "Tên ghế",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Vị trí",
      dataIndex: ["locationId", "name"],
      key: "locationId",
      render: (_: unknown, record: ISeat) => {
        const location = typeof record.locationId === 'object' && record.locationId ? record.locationId.name : '-';
        return location;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: SEAT_STATUS) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
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
      title: "",
      key: "actions",
      render: (_: unknown, item: ISeat) => (
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
        <h3>Danh sách ghế</h3>
        <Space size="middle">
          <Space.Compact>
            <Button
              type={viewMode === 'table' ? 'primary' : 'default'}
              icon={<UnorderedListOutlined />}
              onClick={() => setViewMode('table')}
            >
              Bảng
            </Button>
            <Button
              type={viewMode === 'grid' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('grid')}
            >
              Trạng thái ghế
            </Button>
          </Space.Compact>
          <Link to="add">
            <Button type="primary" icon={<PlusOutlined />} variant="solid">
              Thêm mới
            </Button>
          </Link>
        </Space>
      </div>
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="search" label="Tìm kiếm">
              <Input placeholder="Tên ghế" allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="status" label="Trạng thái">
              <Select allowClear placeholder="Chọn trạng thái">
                <Option value={SEAT_STATUS.AVAILABLE}>Sẵn sàng</Option>
                <Option value={SEAT_STATUS.USING}>Đang sử dụng</Option>
                <Option value={SEAT_STATUS.REPAIR}>Đang sửa chữa</Option>
                <Option value={SEAT_STATUS.DISABLED}>Vô hiệu</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="location" label="Vị trí">
              <Select 
                allowClear 
                placeholder="Chọn vị trí"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {locationList?.data?.map((location: ILocation) => (
                  <Option key={location._id} value={location._id} label={location.name}>
                    {location.name}
                  </Option>
                ))}
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

      <Modal
        title="Xác nhận đổi trạng thái"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="Xác nhận"
        cancelText="Hủy"
        confirmLoading={updateStatusMutation.isPending}
      >
        {selectedSeat && newStatus !== null && (
          <p>
            Bạn có chắc chắn muốn đổi trạng thái ghế <strong>"{selectedSeat.name}"</strong> từ{" "}
            <strong>"{getStatusText(selectedSeat.status)}"</strong> sang{" "}
            <strong>"{getStatusText(newStatus)}"</strong>?
          </p>
        )}
      </Modal>

      {viewMode === 'table' ? (
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
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {isLoading ? (
              <Col span={24}>
                <div style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</div>
              </Col>
            ) : (
              data?.data.map((seat: ISeat) => {
                const location = typeof seat.locationId === 'object' && seat.locationId 
                  ? seat.locationId.name 
                  : '-';
                
                return (
                  <Col
                    key={seat._id}
                    xs={24}
                    sm={12}
                    md={8}
                    lg={6}
                    xl={6}
                  >
                    <Card
                      style={{
                        backgroundColor: getStatusBgColor(seat.status),
                        borderColor: getStatusBorderColor(seat.status),
                        borderWidth: 2,
                        height: '100%',
                      }}
                      hoverable={seat.status === SEAT_STATUS.AVAILABLE || seat.status === SEAT_STATUS.USING}
                      actions={[
                        <Link 
                          key="detail" 
                          to={`detail/${seat._id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <InfoCircleOutlined />
                        </Link>,
                        <Link 
                          key="edit" 
                          to={`edit/${seat._id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <EditOutlined />
                        </Link>,
                        <span onClick={(e) => e.stopPropagation()}>
                          <Popconfirm
                            key="delete"
                            title="Xác nhận xóa"
                            description="Bạn có chắc chắn muốn xóa ghế này không?"
                            onConfirm={() => handleDelete(seat._id)}
                            okText="Xóa"
                            cancelText="Hủy"
                            icon={<QuestionCircleOutlined style={{ color: "red" }} />}
                          >
                            <DeleteOutlined style={{ color: 'red', cursor: 'pointer' }} />
                          </Popconfirm>
                        </span>,
                      ]}
                    >
                      <div 
                        style={{ 
                          textAlign: 'center',
                          cursor: (seat.status === SEAT_STATUS.AVAILABLE || seat.status === SEAT_STATUS.USING) 
                            ? 'pointer' 
                            : 'default',
                          minHeight: '100px',
                        }}
                        onClick={() => {
                          if (seat.status === SEAT_STATUS.AVAILABLE || seat.status === SEAT_STATUS.USING) {
                            handleSeatClick(seat);
                          }
                        }}
                      >
                        <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
                          {seat.name}
                        </div>
                        <div style={{ marginBottom: 4, color: '#666' }}>
                          <strong>Vị trí:</strong> {location}
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <Tag color={getStatusColor(seat.status)} style={{ fontSize: 12 }}>
                            {getStatusText(seat.status)}
                          </Tag>
                        </div>
                        {seat.description && (
                          <div 
                            style={{ 
                              fontSize: 12, 
                              color: '#888', 
                              marginTop: 8,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical'
                            }}
                          >
                            {seat.description}
                          </div>
                        )}
                      </div>
                    </Card>
                  </Col>
                );
              })
            )}
          </Row>
          {data && data.totalDocs > 0 && (
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Pagination
                align="center"
                current={filter.currentPage}
                pageSize={filter.pageSize}
                total={data.totalDocs}
                onChange={(page, pageSize) =>
                  setFilter((prev) => ({ ...prev, currentPage: page, pageSize }))
                }
                showSizeChanger
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} của ${total} ghế`
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SeatList;

