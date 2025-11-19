import { Button, Col, DatePicker, Flex, Form, Input, Row, Select, Space, Card, Divider, message, Modal, Descriptions, Tag, InputNumber } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Toast from "react-hot-toast";
import { useState } from "react";
import { CreateBooking, addBooking } from "../../services/booking";
import { getCustomerByPhone, addCustomer, updateCustomer } from "../../services/customer";
import { CreateCustomer } from "../../types/customer";
import ScheduleSelector, { ScheduleSelectionInfo } from "../../components/ScheduleSelector";
import dayjs, { Dayjs } from "dayjs";
import ICustomer from "../../types/customer";
import { getAllService } from "../../services/service";
import IService from "../../types/service";
import { getServiceType, convertNameRole } from "../../utils/helper";

const { Option } = Select;
const { TextArea } = Input;

function BookingAdd() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState<Dayjs | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<Dayjs | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Dayjs | null>(null);
  const [selectedStaffInfo, setSelectedStaffInfo] = useState<ScheduleSelectionInfo | null>(null);
  const [customerId, setCustomerId] = useState<string>("");
  const [customerFound, setCustomerFound] = useState<ICustomer | null>(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [pendingBookingData, setPendingBookingData] = useState<CreateBooking | null>(null);


  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ["services"],
    queryFn: () => getAllService(),
  });

  // Tìm kiếm khách hàng theo số điện thoại
  const handlePhoneSearch = async (phone: string) => {
    if (!phone || phone.length !== 10) {
      return;
    }

    setIsSearchingCustomer(true);
    try {
      const customer = await getCustomerByPhone(phone);
      setCustomerFound(customer);
      setCustomerId(customer._id);
      
      // Auto-fill form
      form.setFieldsValue({
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        yearOfBirth: customer.yearOfBirth ? dayjs(customer.yearOfBirth) : undefined,
        gender: customer.gender || "other",
        customerNote: customer.note || "",
      });
      
      message.success("Đã tìm thấy thông tin khách hàng");
    } catch {
      // Không tìm thấy, reset customer
      setCustomerFound(null);
      setCustomerId("");
      form.setFieldsValue({
        name: "",
        address: "",
        yearOfBirth: undefined,
        gender: "other",
        customerNote: "",
      });
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  // Tạo khách hàng mới
  const createCustomerMutation = useMutation({
    mutationFn: (data: CreateCustomer) => addCustomer(data),
    onSuccess: (response) => {
      const newCustomer = response.data.data;
      setCustomerFound(newCustomer);
      setCustomerId(newCustomer._id);
      Toast.success("Đã tạo khách hàng mới");
    },
    // onError: (error: unknown) => {
    //   const err = error as { response?: { data?: { message?: string } } };
    //   Toast.error("Tạo khách hàng thất bại: " + (err.response?.data?.message || "Lỗi không xác định"));
    // },
  });

  // Cập nhật thông tin khách hàng
  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCustomer> }) => updateCustomer(id, data),
    onSuccess: () => {
      Toast.success("Đã cập nhật thông tin khách hàng");
    },
    // onError: (error: unknown) => {
    //   const err = error as { response?: { data?: { message?: string } } };
    //   Toast.error("Cập nhật khách hàng thất bại: " + (err.response?.data?.message || "Lỗi không xác định"));
    // },
  });

  // Tạo booking
  const bookingMutation = useMutation({
    mutationFn: (data: CreateBooking) => addBooking(data),
    onSuccess: () => {
      Toast.success("Thêm lịch hẹn thành công");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      form.resetFields();
      setCustomerFound(null);
      setCustomerId("");
      setSelectedDoctorId("");
      setSelectedTimeSlot(null);
      setSelectedEndTime(null);
      setSelectedStaffInfo(null);
      setAppointmentDate(null);
      setSelectedServiceId("");
      setPendingBookingData(null);
      navigate("/booking");
    },
    // onError: (error: unknown) => {
    //   const err = error as { response?: { data?: { message?: string } } };
    //   Toast.error("Thêm lịch hẹn thất bại: " + (err.response?.data?.message || "Lỗi không xác định"));
    // },
  });

  const onFinish = async (values: Record<string, unknown>) => {
    // Nếu chưa có customerId, tạo customer mới trước
    let finalCustomerId = customerId;
    
    // Chuẩn hóa dữ liệu customer từ form values
    const customerData: Omit<CreateCustomer, 'yearOfBirth'> & { yearOfBirth?: string } = {
      name: values.name as string,
      phone: values.phone as string,
      address: values.address as string,
      yearOfBirth: values.yearOfBirth && dayjs.isDayjs(values.yearOfBirth)
        ? values.yearOfBirth.toISOString()
        : values.yearOfBirth as string | undefined,
      gender: (values.gender as string) || "other",
      note: (values.customerNote as string) || "",
    };

    if (!finalCustomerId) {
      // Tạo customer mới
      try {
        const response = await createCustomerMutation.mutateAsync(customerData as unknown as CreateCustomer);
        finalCustomerId = response.data.data._id;
      } catch {
        return; // Error đã được xử lý trong mutation
      }
    } else {
      // Kiểm tra xem thông tin khách hàng có thay đổi không
      const existingDateStr = customerFound?.yearOfBirth 
        ? dayjs(customerFound.yearOfBirth).startOf('day').toISOString() 
        : '';
      const newDateStr = customerData.yearOfBirth 
        ? dayjs(customerData.yearOfBirth).startOf('day').toISOString() 
        : '';
      
      const hasChanges = customerFound && (
        customerFound.name !== customerData.name ||
        customerFound.phone !== customerData.phone ||
        customerFound.address !== customerData.address ||
        customerFound.gender !== customerData.gender ||
        customerFound.note !== customerData.note ||
        existingDateStr !== newDateStr
      );

      // Nếu có thay đổi, cập nhật thông tin khách hàng
      if (hasChanges) {
        try {
          // Chuẩn hóa dữ liệu để gửi lên server
          const updateData: Record<string, unknown> = { ...customerData };
          if (updateData.yearOfBirth) {
            updateData.yearOfBirth = new Date(customerData.yearOfBirth!);
          }
          await updateCustomerMutation.mutateAsync({ id: customerId, data: updateData as Partial<CreateCustomer> });
          // Cập nhật lại customerFound sau khi update
          const updatedCustomer = {
            ...customerFound,
            ...customerData,
            yearOfBirth: customerData.yearOfBirth ? new Date(customerData.yearOfBirth) : customerFound.yearOfBirth,
          };
          setCustomerFound(updatedCustomer as ICustomer);
        } catch {
          return; // Error đã được xử lý trong mutation
        }
      }
    }

    if (!selectedDoctorId || !selectedTimeSlot || !appointmentDate) {
      message.error("Vui lòng chọn lịch hẹn");
      return;
    }

    if (!values.serviceId) {
      message.error("Vui lòng chọn thủ thuật");
      return;
    }

    // Find the selected service to get duration
    const selectedService = services?.find((service: IService) => service._id === values.serviceId as string);
    if (!selectedService) {
      message.error("Không tìm thấy thông tin dịch vụ");
      return;
    }

    // Use endTime from schedule selector if available, otherwise calculate
    const timeEnd = selectedEndTime || selectedTimeSlot.add(selectedService.time, 'second');

    // Calculate doctorDate = timeEnd - service.time (only for trick type)
    // service.time is in seconds
    const doctorDate = selectedService.type === "trick" 
      ? dayjs(timeEnd.toDate()).subtract(selectedService.time, 'second').toDate()
      : undefined;

    const bookingData: CreateBooking = {
      customerId: finalCustomerId,
      serviceId: values.serviceId as string,
      appointmentDate: selectedTimeSlot.toDate(),
      timeEnd: timeEnd.toDate(),
      doctorId: selectedDoctorId, // Always send doctorId (used for StaffAssignment in job type)
      // Only include doctorDate for trick type
      ...(selectedService.type === "trick" && {
        doctorDate: doctorDate, // timeEnd - service.time
      }),
      priority: (values.priority as boolean) || false,
      note: (values.bookingNote as string) || "",
      type: selectedService.type,
    };

    // Save pending booking data and show confirmation modal
    setPendingBookingData(bookingData);
    setConfirmModalOpen(true);
  };

  const handleConfirmBooking = () => {
    if (!pendingBookingData) return;
    bookingMutation.mutate(pendingBookingData);
    setConfirmModalOpen(false);
  };

  const handleScheduleSelect = (info: ScheduleSelectionInfo) => {
    setSelectedStaffInfo(info);
    setSelectedDoctorId(info.staffId);
    setSelectedTimeSlot(info.startTime);
    setSelectedEndTime(info.endTime);
    form.setFieldsValue({
      selectedSchedule: `${info.startTime.format("DD/MM/YYYY HH:mm")} - ${info.staffName} (${convertNameRole(info.staffRole)})`,
    });
  };

  const handleAppointmentDateChange = (date: Dayjs | null) => {
    setAppointmentDate(date);
    if (!date) {
      setSelectedDoctorId("");
      setSelectedTimeSlot(null);
    }
  };

  return (
    <div>
      <h2>Thêm mới lịch hẹn</h2>

      <Flex justify="center">
        <div style={{ width: "100%", maxWidth: 1200, padding: "0 16px" }}>
          <Form form={form} onFinish={onFinish} layout="vertical">
            {/* Phần 1: Thông tin khách hàng */}
            <Card title="Thông tin khách hàng" style={{ marginBottom: 24 }}>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    rules={[
                      { required: true, message: "Vui lòng nhập số điện thoại" },
                      {
                        pattern: /^[0-9]{10}$/,
                        message: "Số điện thoại phải có đúng 10 chữ số",
                      },
                    ]}
                  >
                    <Input.Search
                      placeholder="Nhập số điện thoại để tìm khách hàng"
                      maxLength={10}
                      loading={isSearchingCustomer}
                      onSearch={handlePhoneSearch}
                      enterButton="Tìm kiếm"
                      onChange={(e) => {
                        const phone = e.target.value;
                        if (phone.length === 10) {
                          handlePhoneSearch(phone);
                        } else {
                          setCustomerFound(null);
                          setCustomerId("");
                        }
                      }}
                    />
                  </Form.Item>

                  {customerFound && (
                    <div style={{ marginBottom: 16, padding: 12, backgroundColor: "#f0f9ff", borderRadius: 4 }}>
                      <strong style={{ color: "#008000" }}>Đã tìm thấy khách hàng</strong>
                    </div>
                  )}

                  <Form.Item
                    name="name"
                    label="Họ và tên"
                    rules={[
                      { required: true, message: "Vui lòng nhập họ và tên" },
                      { min: 1, message: "Họ và tên phải có ít nhất 1 ký tự" },
                      { max: 200, message: "Họ và tên tối đa 200 ký tự" },
                    ]}
                  >
                    <Input placeholder="Nhập họ và tên" />
                  </Form.Item>

                  <Form.Item
                    name="yearOfBirth"
                    label="Năm sinh"
                    rules={[
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          const currentYear = new Date().getFullYear();
                          if (value < 1900 || value > currentYear - 1) {
                            return Promise.reject(new Error("Năm sinh phải lớn hơn 1 tuổi"));
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="Nhập năm sinh"
                      min={1900}
                      // max={new Date().getFullYear() - 1}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="address"
                    label="Địa chỉ"
                    rules={[
                      { required: true, message: "Vui lòng nhập địa chỉ" },
                      { min: 5, message: "Địa chỉ phải có ít nhất 5 ký tự" },
                      { max: 300, message: "Địa chỉ tối đa 300 ký tự" },
                    ]}
                  >
                    <Input.TextArea
                      placeholder="Nhập địa chỉ"
                      rows={5}
                      maxLength={300}
                      showCount
                    />
                  </Form.Item>
                  <Form.Item
                    name="gender"
                    label="Giới tính"
                    rules={[
                      { required: true, message: "Vui lòng chọn giới tính" },
                    ]}
                  >
                    <Select placeholder="Chọn giới tính">
                      <Option value="male">Nam</Option>
                      <Option value="female">Nữ</Option>
                      <Option value="other">Khác</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Divider />

            {/* Phần 2: Thông tin đặt lịch */}
            <Card title="Thông tin đặt lịch">
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="serviceId"
                    label="Thủ thuật"
                    rules={[
                      { required: true, message: "Vui lòng chọn thủ thuật" },
                    ]}
                  >
                    <Select
                      placeholder="Chọn thủ thuật"
                      loading={isLoadingServices}
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? "").toString().toLowerCase().includes(input.toString().toLowerCase())
                      }
                      options={services
                        ?.filter((service: IService) => 
                          service.type === "trick" || (service.type === "job" && service.isFirst === false)
                        )
                        .map((service: IService) => ({
                          label: `${service.name} - ${getServiceType(service.type)}`,
                          value: service._id,
                        }))}
                      onChange={(value) => {
                        const previousServiceId = selectedServiceId;
                        setSelectedServiceId(value);
                        // Reset appointment date khi chọn lại thủ thuật khác
                        if (value !== previousServiceId) {
                          form.setFieldsValue({ appointmentDate: null });
                          setAppointmentDate(null);
                          setSelectedDoctorId("");
                          setSelectedTimeSlot(null);
                        }
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="appointmentDate"
                    label="Ngày khám"
                    rules={[
                      { required: true, message: "Vui lòng chọn ngày khám" },
                    ]}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      placeholder="Chọn ngày khám"
                      format="DD/MM/YYYY"
                      onChange={handleAppointmentDateChange}
                      disabled={!selectedServiceId}
                      disabledDate={(current) => {
                        return current && current < dayjs().startOf("day");
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="selectedSchedule"
                    label="Chọn lịch hẹn (Bác sĩ với Thủ thuật Hoặc Công việc với KTV)"
                    rules={[
                      { required: true, message: "Vui lòng chọn lịch hẹn" },
                    ]}
                  >
                    <Input
                      placeholder={
                        appointmentDate
                          ? "Click để chọn bác sĩ và thời gian"
                          : "Vui lòng chọn ngày khám trước"
                      }
                      readOnly
                      disabled={!appointmentDate}
                      onClick={() => {
                        if (!appointmentDate) {
                          message.warning("Vui lòng chọn ngày khám trước khi chọn lịch hẹn");
                          return;
                        }
                        setScheduleModalOpen(true);
                      }}
                      value={
                        selectedTimeSlot && selectedDoctorId
                          ? `${selectedTimeSlot.format("DD/MM/YYYY HH:mm")}`
                          : ""
                      }
                      suffix={
                        <Button
                          type="link"
                          disabled={!appointmentDate}
                          onClick={() => {
                            if (!appointmentDate) {
                              message.warning("Vui lòng chọn ngày khám trước khi chọn lịch hẹn");
                              return;
                            }
                            setScheduleModalOpen(true);
                          }}
                        >
                          Chọn lịch
                        </Button>
                      }
                    />
                  </Form.Item>

                  <Form.Item
                    name="priority"
                    label="Ưu tiên"
                    initialValue={false}
                  >
                    <Select>
                      <Option value={false}>Không ưu tiên</Option>
                      <Option value={true}>Ưu tiên</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="bookingNote"
                    label="Ghi chú đặt lịch"
                    rules={[
                      { max: 500, message: "Ghi chú tối đa 500 ký tự" },
                    ]}
                  >
                    <TextArea
                      placeholder="Nhập ghi chú cho lịch hẹn (nếu có)"
                      rows={6}
                      maxLength={500}
                      showCount
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
                    loading={bookingMutation.isPending || createCustomerMutation.isPending}
                  >
                    Thêm mới
                  </Button>
                </Space>
              </Form.Item>
            </Row>
          </Form>
        </div>
      </Flex>

      {appointmentDate && selectedServiceId && (
        <ScheduleSelector
          open={scheduleModalOpen}
          onCancel={() => setScheduleModalOpen(false)}
          onSelect={handleScheduleSelect}
          selectedDate={appointmentDate}
          serviceId={selectedServiceId}
        />
      )}

      {/* Modal xác nhận thông tin đặt lịch */}
      <Modal
        title="Xác nhận thông tin đặt lịch"
        open={confirmModalOpen}
        onOk={handleConfirmBooking}
        onCancel={() => setConfirmModalOpen(false)}
        okText="Xác nhận"
        cancelText="Hủy"
        width={700}
        okButtonProps={{ loading: bookingMutation.isPending }}
      >
        {pendingBookingData && customerFound && selectedStaffInfo && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Khách hàng">
              <div>
                <div><strong>{customerFound.name}</strong></div>
                <div style={{ fontSize: 12, color: "#666" }}>SĐT: {customerFound.phone}</div>
                <div style={{ fontSize: 12, color: "#666" }}>Địa chỉ: {customerFound.address}</div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Dịch vụ">
              {services?.find((s: IService) => s._id === pendingBookingData.serviceId)?.name || ""}
              <Tag color={selectedStaffInfo.serviceType === "job" ? "blue" : "purple"} style={{ marginLeft: 8 }}>
                {getServiceType(selectedStaffInfo.serviceType)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Người thực hiện">
              <div>
                <div><strong>{selectedStaffInfo.staffName}</strong></div>
                <Tag color={selectedStaffInfo.staffRole === "doctor" ? "blue" : "cyan"}>
                  {convertNameRole(selectedStaffInfo.staffRole)}
                </Tag>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              <div>
                <div>Bắt đầu: <strong>{selectedTimeSlot?.format("DD/MM/YYYY HH:mm")}</strong></div>
                <div>Kết thúc: <strong>{selectedEndTime?.format("DD/MM/YYYY HH:mm")}</strong></div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Ưu tiên">
              {pendingBookingData.priority ? <Tag color="red">Có</Tag> : <Tag>Không</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú">
              { pendingBookingData.note && pendingBookingData.note || "Không có ghi chú"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

export default BookingAdd;

