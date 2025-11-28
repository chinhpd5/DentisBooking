import { Button, Col, DatePicker, Flex, Form, Input, Row, Space, Card, Divider, message, Modal, Descriptions, Tag } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Toast from "react-hot-toast";
import { useState, useEffect, useMemo } from "react";
import { CreateBooking, updateBooking, getBookingById } from "../../services/booking";
import dayjs, { Dayjs } from "dayjs";
import { BOOKING_STATUS } from "../../contants";
import IBooking from "../../types/booking";
import IService from "../../types/service";
import type IJob from "../../types/job";
import { getServiceType, convertNameRole } from "../../utils/helper";
import { ArrowLeftOutlined } from "@ant-design/icons";

function BookingEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<Partial<CreateBooking> & { status?: BOOKING_STATUS } | null>(null);

  // Fetch existing booking data
  const { data: booking, isLoading: isLoadingBooking } = useQuery<IBooking>({
    queryKey: ["booking", id],
    queryFn: () => getBookingById(id!),
    enabled: !!id,
  });

  // Initialize form with booking data
  useEffect(() => {
    if (booking) {
      form.setFieldsValue({
        appointmentDate: booking.appointmentDate ? dayjs(booking.appointmentDate) : null,
        timeEnd: booking.timeEnd ? dayjs(booking.timeEnd) : null,
      });
    }
  }, [booking, form]);

  // Tính toán tổng thời gian của service (service.time + sum of job times)
  const calculateServiceDuration = useMemo(() => {
    if (!booking?.serviceId) return 0;
    const service = booking.serviceId as IService;
    let total = service.time || 0;
    if (service.jobIds && service.jobIds.length > 0) {
      total += service.jobIds.reduce((sum: number, job: IJob) => sum + (job.time || 0), 0);
    }
    return total;
  }, [booking]);

  // Handler khi thay đổi thời gian bắt đầu
  const handleAppointmentDateChange = (date: Dayjs | null) => {
    if (!date || !booking?.serviceId) return;
    
    // Tính thời gian kết thúc = thời gian bắt đầu + duration
    const newEndTime = date.add(calculateServiceDuration, 'second');
    
    // Cập nhật form
    form.setFieldsValue({
      timeEnd: newEndTime,
    });
  };

  // Cập nhật booking
  const bookingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBooking> & { status?: BOOKING_STATUS } }) => updateBooking(id, data),
    onSuccess: () => {
      Toast.success("Cập nhật lịch hẹn thành công");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["booking", id] });
      navigate("/booking");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      Toast.error("Cập nhật lịch hẹn thất bại: " + (err.response?.data?.message || "Lỗi không xác định"));
    },
  });

  const onFinish = async (values: Record<string, unknown>) => {
    if (!booking) return;

    const appointmentDate = values.appointmentDate as Dayjs;
    const timeEnd = values.timeEnd as Dayjs;

    // Validate that timeEnd is after appointmentDate
    if (timeEnd && appointmentDate && timeEnd.isBefore(appointmentDate)) {
      message.error("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }

    // Prepare booking update data - only update appointmentDate, timeEnd, and status
    const bookingUpdateData: Partial<CreateBooking> & { status?: BOOKING_STATUS } = {
      appointmentDate: appointmentDate ? appointmentDate.toDate() : booking.appointmentDate,
      timeEnd: timeEnd ? timeEnd.toDate() : booking.timeEnd,
      // status: BOOKING_STATUS.CHANGED,
    };

    // If service type is trick, calculate doctorDate
    const serviceType = booking.type || booking.serviceId?.type;
    if (serviceType === "trick" && timeEnd && booking.serviceId?.time) {
      const serviceTime = booking.serviceId.time;
      bookingUpdateData.doctorDate = dayjs(timeEnd.toDate()).subtract(serviceTime, 'second').toDate();
    }

    // Save pending booking data and show confirmation modal
    setPendingBookingData(bookingUpdateData);
    setConfirmModalOpen(true);
  };

  const handleConfirmBooking = () => {
    if (!pendingBookingData || !id) return;
    bookingMutation.mutate({ id, data: pendingBookingData });
    setConfirmModalOpen(false);
  };

  if (isLoadingBooking) {
    return <div>Đang tải...</div>;
  }

  if (!booking) {
    return <div>Không tìm thấy lịch hẹn</div>;
  }

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Cập nhật lịch hẹn</h2>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/booking")}>
          Quay lại
        </Button>
      </Flex>

      <Flex justify="center">
        <div style={{ width: "100%", maxWidth: 1200, padding: "0 16px" }}>
          <Form form={form} onFinish={onFinish} layout="vertical">
            {/* Phần 1: Thông tin khách hàng (chỉ đọc) */}
            <Card title="Thông tin khách hàng" style={{ marginBottom: 24 }}>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="Số điện thoại">
                    <Input value={booking.customerId?.phone || ""} disabled />
                  </Form.Item>

                  <Form.Item label="Họ và tên">
                    <Input value={booking.customerId?.name || ""} disabled />
                  </Form.Item>

                  <Form.Item label="Năm sinh">
                    <Input
                      value={booking.customerId?.yearOfBirth || ""}
                      disabled
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="Địa chỉ">
                    <Input.TextArea
                      value={booking.customerId?.address || ""}
                      rows={5}
                      disabled
                    />
                  </Form.Item>

                  <Form.Item label="Giới tính">
                    <Input
                      value={
                        booking.customerId?.gender === "male"
                          ? "Nam"
                          : booking.customerId?.gender === "female"
                          ? "Nữ"
                          : "Khác"
                      }
                      disabled
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Divider />

            {/* Phần 2: Thông tin đặt lịch */}
            <Card title="Thông tin đặt lịch">
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="Dịch vụ">
                    <Input
                      value={booking.serviceId?.name || ""}
                      disabled
                      suffix={
                        booking.serviceId && (
                          <Tag color={booking.serviceId.type === "job" ? "blue" : "purple"}>
                            {getServiceType(booking.serviceId.type)}
                          </Tag>
                        )
                      }
                    />
                  </Form.Item>

                  <Form.Item
                    name="appointmentDate"
                    label="Thời gian bắt đầu"
                    rules={[
                      { required: true, message: "Vui lòng chọn thời gian bắt đầu" },
                    ]}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      placeholder="Chọn thời gian bắt đầu"
                      format="DD/MM/YYYY HH:mm"
                      showTime={{ format: "HH:mm" }}
                      onChange={handleAppointmentDateChange}
                    />
                  </Form.Item>

                  <Form.Item
                    name="timeEnd"
                    label="Thời gian kết thúc"
                    rules={[
                      { required: true, message: "Vui lòng chọn thời gian kết thúc" },
                    ]}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      placeholder="Chọn thời gian kết thúc"
                      format="DD/MM/YYYY HH:mm"
                      showTime={{ format: "HH:mm" }}
                    />
                  </Form.Item>

                  <Form.Item label="Người thực hiện">
                    <Input
                      value={booking.doctorId?.name || ""}
                      disabled
                      suffix={
                        booking.doctorId && (
                          <Tag color={booking.doctorId.role === "doctor" ? "blue" : "cyan"}>
                            {convertNameRole(booking.doctorId.role)}
                          </Tag>
                        )
                      }
                    />
                  </Form.Item>

                  <Form.Item label="Ưu tiên">
                    <Input
                      value={booking.priority ? "Có" : "Không"}
                      disabled
                      suffix={
                        booking.priority ? <Tag color="red">Ưu tiên</Tag> : <Tag>Không ưu tiên</Tag>
                      }
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="Ghi chú đặt lịch">
                    <Input.TextArea
                      value={booking.note || "Không có ghi chú"}
                      rows={6}
                      disabled
                    />
                  </Form.Item>

                  <Form.Item label="Trạng thái">
                    <Input
                      value={
                        booking.status === "booked"
                          ? "Đã đặt"
                          : booking.status === "arrived"
                          ? "Đã đến"
                          : booking.status === "inProgress"
                          ? "Đang làm"
                          : booking.status === "completed"
                          ? "Hoàn thành"
                          : booking.status === "cancelled"
                          ? "Hủy"
                          : booking.status === "changed"
                          ? "Thay đổi lịch"
                          : ""
                      }
                      disabled
                      suffix={
                        <Tag
                          color={
                            booking.status === "booked"
                              ? "green"
                              : booking.status === "arrived"
                              ? "blue"
                              : booking.status === "inProgress"
                              ? "orange"
                              : booking.status === "completed"
                              ? "purple"
                              : booking.status === "cancelled"
                              ? "red"
                              : booking.status === "changed"
                              ? "gold"
                              : "default"
                          }
                        >
                          {booking.status === "booked"
                            ? "Đã đặt"
                            : booking.status === "arrived"
                            ? "Đã đến"
                            : booking.status === "inProgress"
                            ? "Đang làm"
                            : booking.status === "completed"
                            ? "Hoàn thành"
                            : booking.status === "cancelled"
                            ? "Hủy"
                            : booking.status === "changed"
                            ? "Thay đổi lịch"
                            : ""}
                        </Tag>
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Row justify="start" style={{ marginTop: 24 }}>
              <Form.Item>
                <Space>
                  <Button onClick={() => navigate("/booking")}>
                    Hủy
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={bookingMutation.isPending}
                  >
                    Cập nhật
                  </Button>
                </Space>
              </Form.Item>
            </Row>
          </Form>
        </div>
      </Flex>

      {/* Modal xác nhận thông tin cập nhật lịch hẹn */}
      <Modal
        title="Xác nhận cập nhật lịch hẹn"
        open={confirmModalOpen}
        onOk={handleConfirmBooking}
        onCancel={() => setConfirmModalOpen(false)}
        okText="Xác nhận"
        cancelText="Hủy"
        width={700}
        okButtonProps={{ loading: bookingMutation.isPending }}
      >
        {pendingBookingData && booking && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Khách hàng">
              <div>
                <div><strong>{booking.customerId?.name}</strong></div>
                <div style={{ fontSize: 12, color: "#666" }}>SĐT: {booking.customerId?.phone}</div>
                <div style={{ fontSize: 12, color: "#666" }}>Địa chỉ: {booking.customerId?.address}</div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Dịch vụ">
              {booking.serviceId?.name || ""}
              <Tag color={booking.serviceId?.type === "job" ? "blue" : "purple"} style={{ marginLeft: 8 }}>
                {booking.serviceId ? getServiceType(booking.serviceId.type) : ""}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Người thực hiện">
              <div>
                <div><strong>{booking.doctorId?.name || ""}</strong></div>
                <Tag color={booking.doctorId?.role === "doctor" ? "blue" : "cyan"}>
                  {booking.doctorId ? convertNameRole(booking.doctorId.role) : ""}
                </Tag>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian cũ">
              <div>
                <div>Bắt đầu: <strong>{dayjs(booking.appointmentDate).format("DD/MM/YYYY HH:mm")}</strong></div>
                <div>Kết thúc: <strong>{dayjs(booking.timeEnd).format("DD/MM/YYYY HH:mm")}</strong></div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian mới">
              <div>
                <div>Bắt đầu: <strong style={{ color: "#1890ff" }}>{pendingBookingData.appointmentDate ? dayjs(pendingBookingData.appointmentDate).format("DD/MM/YYYY HH:mm") : ""}</strong></div>
                <div>Kết thúc: <strong style={{ color: "#1890ff" }}>{pendingBookingData.timeEnd ? dayjs(pendingBookingData.timeEnd).format("DD/MM/YYYY HH:mm") : ""}</strong></div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Ưu tiên">
              {booking.priority ? <Tag color="red">Có</Tag> : <Tag>Không</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú">
              {booking.note && booking.note || "Không có ghi chú"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default BookingEdit;
