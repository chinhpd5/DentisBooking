import { Button, Col, DatePicker, Form, Input, Modal, Popconfirm, Row, Select, Space, Table, Tag } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DeleteOutlined, InfoCircleOutlined, PlusOutlined, QuestionCircleOutlined, SearchOutlined } from "@ant-design/icons";
import { getListBooking, deleteBooking, updateBookingStatus } from "../../services/booking";
import { getAllStaff } from "../../services/staff";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import IBooking from "../../types/booking";
import IData from "../../types";
import dayjs, { Dayjs } from "dayjs";
import { BOOKING_STATUS, SERVICE_TYPE, USER_ROLE } from "../../contants";
import { IStaff } from "../../types/staff";
import { ColumnType } from "antd/es/table";

const { Option } = Select;

type FilterType = {
  currentPage: number;
  pageSize: number;
  search?: string | undefined;
  status?: BOOKING_STATUS | undefined;
  doctorId?: string | undefined;
  staffId?: string | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
};

function BookingList() {
  const [form] = Form.useForm();
  const [timeForm] = Form.useForm();
  const [filter, setFilter] = useState<FilterType>({
    currentPage: 1,
    pageSize: 10,
  });
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    id: string;
    oldStatus: BOOKING_STATUS;
    newStatus: BOOKING_STATUS;
  } | null>(null);
  const [currentTime, setCurrentTime] = useState(dayjs());

  // Cập nhật thời gian hiện tại mỗi giây để đồng hồ chạy
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const { data, isLoading, error } = useQuery<IData<IBooking>>({
    queryKey: ["bookings", filter],
    queryFn: () =>
      getListBooking(
        filter.currentPage,
        filter.pageSize,
        filter.search,
        filter.status,
        filter.doctorId,
        filter.staffId,
        filter.fromDate,
        filter.toDate
      ),
    placeholderData: (prev) => prev,
  });

  if (error) {
    toast.error((error as Error).message);
  }

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteBooking,
    onSuccess: () => {
      toast.success("Xóa thành công");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    // onError: (error: unknown) => {
    //   const err = error as { response?: { data?: { message?: string } } };
    //   toast.error("Xóa thất bại: " + (err.response?.data?.message || "Lỗi không xác định"));
    // },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, comingTime, doingTime, completeTime }: { 
      id: string; 
      status: BOOKING_STATUS;
      comingTime?: Date;
      doingTime?: Date;
      completeTime?: Date;
    }) => updateBookingStatus(id, status, comingTime, doingTime, completeTime),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error("Cập nhật trạng thái thất bại: " + (err.response?.data?.message || "Lỗi không xác định"));
    },
  });

  const { data: doctorList, isLoading: isLoadingDoctors } = useQuery<IStaff[]>({
    queryKey: ["staff", "doctors"],
    queryFn: () => getAllStaff(USER_ROLE.DOCTOR),
  });

  const { data: staffList, isLoading: isLoadingStaffs } = useQuery<IStaff[]>({
    queryKey: ["staff", "ktv"],
    queryFn: () => getAllStaff(USER_ROLE.STAFF),
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleStatusChange = (id: string, newStatus: BOOKING_STATUS, oldStatus: BOOKING_STATUS) => {
    // Nếu trạng thái không thay đổi, không làm gì
    if (newStatus === oldStatus) {
      return;
    }
    
    // Nếu booking đã bị hủy, không cho phép đổi sang trạng thái khác
    if (oldStatus === BOOKING_STATUS.CANCELLED) {
      toast.error("Booking đã hủy không thể đổi sang trạng thái khác");
      return;
    }
    
    // Lưu thông tin thay đổi để hiển thị confirm
    setPendingStatusChange({ id, oldStatus, newStatus });
    
    // Reset form và set giá trị mặc định là thời gian hiện tại
    timeForm.resetFields();
    if (oldStatus === BOOKING_STATUS.BOOKED && newStatus === BOOKING_STATUS.ARRIVED) {
      timeForm.setFieldValue('comingTime', dayjs());
    } else if (oldStatus === BOOKING_STATUS.ARRIVED && newStatus === BOOKING_STATUS.IN_PROGRESS) {
      timeForm.setFieldValue('doingTime', dayjs());
    } else if (oldStatus === BOOKING_STATUS.IN_PROGRESS && newStatus === BOOKING_STATUS.COMPLETED) {
      timeForm.setFieldValue('completeTime', dayjs());
    }
  };

  const handleConfirmStatusChange = () => {
    if (!pendingStatusChange) return;
    
    const { id, oldStatus, newStatus } = pendingStatusChange;
    
    // Kiểm tra xem có cần nhập thời gian không
    const needsTime = (
      (oldStatus === BOOKING_STATUS.BOOKED && newStatus === BOOKING_STATUS.ARRIVED) ||
      (oldStatus === BOOKING_STATUS.ARRIVED && newStatus === BOOKING_STATUS.IN_PROGRESS) ||
      (oldStatus === BOOKING_STATUS.IN_PROGRESS && newStatus === BOOKING_STATUS.COMPLETED)
    );
    
    if (needsTime) {
      // Validate form trước khi submit
      timeForm.validateFields().then((values) => {
        const comingTime = values.comingTime ? values.comingTime.toDate() : undefined;
        const doingTime = values.doingTime ? values.doingTime.toDate() : undefined;
        const completeTime = values.completeTime ? values.completeTime.toDate() : undefined;

        updateStatusMutation.mutate(
          { 
            id, 
            status: newStatus,
            comingTime,
            doingTime,
            completeTime,
          },
          {
            onSuccess: () => {
              setPendingStatusChange(null);
              timeForm.resetFields();
            },
            onError: () => {
              setPendingStatusChange(null);
              timeForm.resetFields();
            },
          }
        );
      }).catch(() => {
        // Validation failed
      });
    } else {
      // Không cần thời gian, gửi luôn
      updateStatusMutation.mutate(
        { 
          id, 
          status: newStatus,
        },
        {
          onSuccess: () => {
            setPendingStatusChange(null);
            timeForm.resetFields();
          },
          onError: () => {
            setPendingStatusChange(null);
            timeForm.resetFields();
          },
        }
      );
    }
  };

  const handleCancelStatusChange = () => {
    setPendingStatusChange(null);
    timeForm.resetFields();
    // Invalidate queries để reset lại giá trị Select về giá trị cũ
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
  };

  // Kiểm tra có cần hiển thị input thời gian không
  const needsTimeInput = (): boolean => {
    if (!pendingStatusChange) return false;
    const { oldStatus, newStatus } = pendingStatusChange;
    return (
      (oldStatus === BOOKING_STATUS.BOOKED && newStatus === BOOKING_STATUS.ARRIVED) ||
      (oldStatus === BOOKING_STATUS.ARRIVED && newStatus === BOOKING_STATUS.IN_PROGRESS) ||
      (oldStatus === BOOKING_STATUS.IN_PROGRESS && newStatus === BOOKING_STATUS.COMPLETED)
    );
  };

  // Lấy label cho input thời gian
  const getTimeInputLabel = (): string => {
    if (!pendingStatusChange) return "";
    const { oldStatus, newStatus } = pendingStatusChange;
    if (oldStatus === BOOKING_STATUS.BOOKED && newStatus === BOOKING_STATUS.ARRIVED) {
      return "Thời gian đến";
    }
    if (oldStatus === BOOKING_STATUS.ARRIVED && newStatus === BOOKING_STATUS.IN_PROGRESS) {
      return "Thời gian bắt đầu làm";
    }
    if (oldStatus === BOOKING_STATUS.IN_PROGRESS && newStatus === BOOKING_STATUS.COMPLETED) {
      return "Thời gian hoàn thành";
    }
    return "";
  };

  // Lấy field name cho input thời gian
  const getTimeFieldName = (): string => {
    if (!pendingStatusChange) return "";
    const { oldStatus, newStatus } = pendingStatusChange;
    if (oldStatus === BOOKING_STATUS.BOOKED && newStatus === BOOKING_STATUS.ARRIVED) {
      return "comingTime";
    }
    if (oldStatus === BOOKING_STATUS.ARRIVED && newStatus === BOOKING_STATUS.IN_PROGRESS) {
      return "doingTime";
    }
    if (oldStatus === BOOKING_STATUS.IN_PROGRESS && newStatus === BOOKING_STATUS.COMPLETED) {
      return "completeTime";
    }
    return "";
  };

  // Hàm tính thời gian chờ
  const calculateWaitingTime = (record: IBooking): string | null => {
    const status = record.status;
    
    // "Đã đặt", "Hủy", "Thay đổi lịch": null (Để trống)
    if (status === BOOKING_STATUS.BOOKED || 
        status === BOOKING_STATUS.CANCELLED
        // status === BOOKING_STATUS.CHANGED
      ) {
      return null;
    }
    
    // "Đã đến": thời gian hiện tại - comingTime (đếm tăng dần)
    if (status === BOOKING_STATUS.ARRIVED) {
      if (!record.comingTime) return null;
      const comingTime = dayjs(record.comingTime);
      const diffMs = currentTime.diff(comingTime);
      return formatDuration(diffMs);
    }
    
    // "Đang làm", "Hoàn thành": thời gian doingTime - comingTime
    if (status === BOOKING_STATUS.IN_PROGRESS || status === BOOKING_STATUS.COMPLETED) {
      if (!record.comingTime || !record.doingTime) return null;
      const comingTime = dayjs(record.comingTime);
      const doingTime = dayjs(record.doingTime);
      const diffMs = doingTime.diff(comingTime);
      return formatDuration(diffMs);
    }
    
    return null;
  };

  // Hàm format thời gian dạng HH:mm:ss
  const formatDuration = (ms: number): string => {
    if (ms < 0) return "00:00:00";
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };


  const handleFinish = (values: {
    search?: string;
    status?: BOOKING_STATUS;
    doctorId?: string;
    staffId?: string;
    dateRange?: [Dayjs, Dayjs];
  }) => {
    setFilter({
      currentPage: 1,
      pageSize: 10,
      search: values.search || undefined,
      status: values.status || undefined,
      doctorId: values.doctorId || undefined,
      staffId: values.staffId || undefined,
      fromDate: values.dateRange?.[0] ? values.dateRange[0].format("YYYY-MM-DD") : undefined,
      toDate: values.dateRange?.[1] ? values.dateRange[1].format("YYYY-MM-DD") : undefined,
    });
  };

  const handleReset = () => {
    form.resetFields();
    setFilter({
      currentPage: 1,
      pageSize: 10,
      search: undefined,
      status: undefined,
      doctorId: undefined,
      staffId: undefined,
      fromDate: undefined,
      toDate: undefined,
    });
  };

  const getStatusText = (status: BOOKING_STATUS): string => {
    const statusMap: Record<BOOKING_STATUS, string> = {
      [BOOKING_STATUS.BOOKED]: "Đã đặt",
      [BOOKING_STATUS.ARRIVED]: "Đã đến",
      [BOOKING_STATUS.IN_PROGRESS]: "Đang làm",
      [BOOKING_STATUS.COMPLETED]: "Hoàn thành",
      [BOOKING_STATUS.CANCELLED]: "Hủy",
      // [BOOKING_STATUS.CHANGED]: "Thay đổi lịch",
    };
    return statusMap[status] || status;
  };

  const columns = [
    {
      title: "STT",
      render: (_: IBooking, __: IBooking, index: number) =>
        (filter.currentPage - 1) * filter.pageSize + index + 1,
      width: 70,
      fixed: 'left',
    },
    {
      title: "Khách hàng",
      render: (record: IBooking) => (
        <div>
          <div>{record.customerId?.name || "-"}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{record.customerId?.phone || "-"}</div>
        </div>
      ),
      fixed: 'left',
    },
    {
      title: "Dịch vụ",
      onCell: () => ({
        style: { minWidth: 180 },
      }),
      render: (record: IBooking) => (
        record.serviceId?.name || "-"
      ),
      fixed: 'left',
    },
    {
      title: "Ngày hẹn",
      render: (record: IBooking) =>
        record.appointmentDate ? dayjs(record.appointmentDate).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Thời gian đến",
      render: (record: IBooking) =>
        record.comingTime ? dayjs(record.comingTime).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Thời gian chờ",
      render: (record: IBooking) => {
        const waitingTime = calculateWaitingTime(record);
        if (waitingTime === null) {
          return "-";
        }
        return (
          <div style={{ 
            fontFamily: 'monospace', 
            fontSize: 16, 
            fontWeight: 'bold',
            color: record.status === BOOKING_STATUS.ARRIVED ? '#ff9800' : 
                   record.status === BOOKING_STATUS.IN_PROGRESS ? '#1890ff' : '#52c41a'
          }}>
            {waitingTime}
          </div>
        );
      },
    },
    {
      title: "Bác sỹ/ KTV",
      onCell: () => ({
        style: { minWidth: 220 },
      }),
      render: (record: IBooking) => {
        if (record.type === SERVICE_TYPE.TRICK) {
          return record.doctorId?.name || "-";
        }

        if (record.type === SERVICE_TYPE.JOB) {
          const staffNames =
            record.staffAssignments
              ?.map((assignment) => assignment.staffId?.name)
              .filter((name): name is string => Boolean(name)) || [];

          if (staffNames.length > 0) {
            return staffNames.join(", ");
          }

          return "-";
        }

        return record.doctorId?.name || "-";
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: BOOKING_STATUS, record: IBooking) => {
        const isPendingForThisRecord = pendingStatusChange?.id === record._id;
        
        return (
          <Select
            value={status}
            onChange={(value) => handleStatusChange(record._id, value, status)}
            style={{ minWidth: 150 }}
            loading={updateStatusMutation.isPending && isPendingForThisRecord}
            disabled={
              updateStatusMutation.isPending || 
              (pendingStatusChange !== null && !isPendingForThisRecord) ||
              status === BOOKING_STATUS.CANCELLED // Disable nếu đã bị hủy
            }
          >
            <Option value={BOOKING_STATUS.BOOKED}>
              <Tag color="blue">Đã đặt</Tag>
            </Option>
            <Option value={BOOKING_STATUS.ARRIVED}>
              <Tag color="cyan">Đã đến</Tag>
            </Option>
            <Option value={BOOKING_STATUS.IN_PROGRESS}>
              <Tag color="orange">Đang làm</Tag>
            </Option>
            <Option value={BOOKING_STATUS.COMPLETED}>
              <Tag color="green">Hoàn thành</Tag>
            </Option>
            <Option value={BOOKING_STATUS.CANCELLED}>
              <Tag color="red">Hủy</Tag>
            </Option>
            {/* <Option value={BOOKING_STATUS.CHANGED}>
              <Tag color="purple">Thay đổi lịch</Tag>
            </Option> */}
          </Select>
        );
      },
    },
    {
      title: "Ưu tiên",
      dataIndex: "priority",
      render: (priority: boolean) => (priority ? <Tag color="red">Có</Tag> : <Tag>Không</Tag>),
    },
    {
      title: "",
      key: "actions",
      render: (_: IBooking, item: IBooking) => (
        <Space size="middle">
          <Link to={`detail/${item._id}`}>
            <Button
              color="blue"
              variant="solid"
              icon={<InfoCircleOutlined />}
            ></Button>
          </Link>
          {/* <Link to={`edit/${item._id}`}>
            <Button
              color="orange"
              variant="solid"
              icon={<EditOutlined />}
            ></Button>
          </Link> */}
         
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
        <h3>Danh sách lịch hẹn</h3>
        <Link to="add">
          <Button type="primary" icon={<PlusOutlined />}>
            Thêm mới
          </Button>
        </Link>
      </div>
      
      <Form layout="vertical" form={form} onFinish={handleFinish}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="search" label="Tìm kiếm">
              <Input placeholder="Tên khách hàng, số điện thoại" allowClear />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="status" label="Trạng thái">
              <Select placeholder="Chọn trạng thái" allowClear>
                <Option value={BOOKING_STATUS.BOOKED}>Đã đặt</Option>
                <Option value={BOOKING_STATUS.ARRIVED}>Đã đến</Option>
                <Option value={BOOKING_STATUS.IN_PROGRESS}>Đang làm</Option>
                <Option value={BOOKING_STATUS.COMPLETED}>Hoàn thành</Option>
                <Option value={BOOKING_STATUS.CANCELLED}>Hủy</Option>
                {/* <Option value={BOOKING_STATUS.CHANGED}>Thay đổi lịch</Option> */}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="dateRange" label="Khoảng thời gian">
              <DatePicker.RangePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                placeholder={["Từ ngày", "Đến ngày"]}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="doctorId" label="Bác sĩ">
              <Select
                placeholder="Chọn bác sĩ"
                allowClear
                loading={isLoadingDoctors}
                showSearch
                optionFilterProp="children"
              >
                {doctorList?.map((doctor: { _id: string; name: string }) => (
                  <Option key={doctor._id} value={doctor._id}>
                    {doctor.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="staffId" label="KTV">
              <Select
                placeholder="Chọn KTV"
                allowClear
                loading={isLoadingStaffs}
                showSearch
                optionFilterProp="children"
              >
                {staffList?.map((staff: { _id: string; name: string }) => (
                  <Option key={staff._id} value={staff._id}>
                    {staff.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col
            span={8}
            style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}
          >
            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button htmlType="submit" type="primary" icon={<SearchOutlined />}>
                  Lọc
                </Button>
                <Button onClick={handleReset}>Đặt lại</Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <Table
        columns={columns as ColumnType<IBooking>[]}
        scroll={{ x: 'max-content' }}
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

      {/* Modal xác nhận đổi trạng thái */}
      <Modal
        title="Xác nhận đổi trạng thái"
        open={pendingStatusChange !== null}
        onOk={handleConfirmStatusChange}
        onCancel={handleCancelStatusChange}
        okText="Xác nhận"
        cancelText="Hủy"
        confirmLoading={updateStatusMutation.isPending}
      >
        {pendingStatusChange && (
          <div>
            <p>Bạn có chắc chắn muốn đổi trạng thái từ</p>
            <p>
              <strong>{getStatusText(pendingStatusChange.oldStatus)}</strong> sang{" "}
              <strong>{getStatusText(pendingStatusChange.newStatus)}</strong>?
            </p>
            
            {needsTimeInput() && (
              <Form form={timeForm} layout="vertical" style={{ marginTop: 16 }}>
                <Form.Item
                  name={getTimeFieldName()}
                  label={getTimeInputLabel()}
                  rules={[{ required: true, message: `Vui lòng nhập ${getTimeInputLabel().toLowerCase()}` }]}
                >
                  <DatePicker
                    showTime
                    format="DD/MM/YYYY HH:mm:ss"
                    style={{ width: "100%" }}
                    placeholder={`Chọn ${getTimeInputLabel().toLowerCase()}`}
                  />
                </Form.Item>
              </Form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default BookingList;