import { Button, Col, DatePicker, Flex, Form, Input, Row, Space, Card, Divider, message, Modal, Descriptions, Tag } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { CreateBooking, updateBooking, getBookingById } from "../../services/booking";
import dayjs, { Dayjs } from "dayjs";
import { BOOKING_STATUS } from "../../contants";
import IBooking from "../../types/booking";

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
      status: BOOKING_STATUS.CHANGED,
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
      <h2>Cập nhật lịch hẹn</h2>

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

                  <Form.Item label="Ngày sinh">
                    <Input
                      value={
                        booking.customerId?.dateOfBirth
                          ? dayjs(booking.customerId.dateOfBirth).format("DD/MM/YYYY")
                          : ""
                      }
                      disabled
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="Địa chỉ">
                    <Input.TextArea
                      value={booking.customerId?.address || ""}
                      rows={4}
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
                  <Form.Item label="Thủ thuật">
                    <Input
                      value={
                        booking.serviceId
                          ? `${booking.serviceId.name} - ${booking.serviceId.type === "trick" ? "Thủ thuật" : "Công việc"}`
                          : ""
                      }
                      disabled
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
                      disabledDate={(current) => {
                        return current && current < dayjs().startOf("day");
                      }}
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
                      disabledDate={(current) => {
                        return current && current < dayjs().startOf("day");
                      }}
                    />
                  </Form.Item>

                  <Form.Item label="Người thực hiện">
                    <Input
                      value={
                        booking.doctorId
                          ? `${booking.doctorId.name} (${booking.doctorId.role === "doctor" ? "Bác sĩ" : "Kỹ thuật viên"})`
                          : ""
                      }
                      disabled
                    />
                  </Form.Item>

                  <Form.Item label="Ưu tiên">
                    <Input
                      value={booking.priority ? "Có" : "Không"}
                      disabled
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="Ghi chú đặt lịch">
                    <Input.TextArea
                      value={booking.note || ""}
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
            </Descriptions.Item>
            <Descriptions.Item label="Người thực hiện">
              <div>
                <div><strong>{booking.doctorId?.name || ""}</strong></div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  {booking.doctorId?.role === "doctor" ? "Bác sĩ" : "Kỹ thuật viên"}
                </div>
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
                <div>Bắt đầu: <strong>{pendingBookingData.appointmentDate ? dayjs(pendingBookingData.appointmentDate).format("DD/MM/YYYY HH:mm") : ""}</strong></div>
                <div>Kết thúc: <strong>{pendingBookingData.timeEnd ? dayjs(pendingBookingData.timeEnd).format("DD/MM/YYYY HH:mm") : ""}</strong></div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái mới">
              <Tag color="orange">Thay đổi lịch</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default BookingEdit;
