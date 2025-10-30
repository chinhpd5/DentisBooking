import { Button, Col, Flex, Form, Input, InputNumber, Row, Select, Space, TimePicker, Alert } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Toast from "react-hot-toast";
import { CreateTrick } from "../../types/trick";
import { TRICK_STATUS,USER_ROLE } from "../../contants";
import { addTrick } from "../../services/trick";
import { getJobIsFirst } from "../../services/job";
import dayjs from "dayjs";
import { useMemo } from "react";
import { getAllStaff } from "../../services/staff";
import { convertNameRole } from "../../utils/helper";

const { Option } = Select;
const { TextArea } = Input;

function TrickAdd() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Watch các field để tính tổng thời gian
  const timeValue = Form.useWatch("time", form);
  const jobIds = Form.useWatch("jobIds", form);

  const { data: staffList } = useQuery({
    queryKey: ["staffs"],
    queryFn: () => getAllStaff(USER_ROLE.DOCTOR),
  });

  const { data: jobList } = useQuery({
    queryKey: ["jobs", 1, 100],
    queryFn: () => getJobIsFirst(),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateTrick) => addTrick(data),
    onSuccess: () => {
      Toast.success("Thêm mới thủ thuật thành công");
      queryClient.invalidateQueries({ queryKey: ["tricks"] });
      form.resetFields();
      navigate("/trick");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      Toast.error("Thêm mới thủ thuật thất bại: " + (error.response?.data?.message || "Lỗi không xác định"));
    },
  });

  const onFinish = (values: Record<string, unknown>) => {
    // Chuyển đổi thời gian từ HH:mm sang giây
    let timeInSeconds = 0;
    if (values.time && dayjs.isDayjs(values.time)) {
      const hours = values.time.hour();
      const minutes = values.time.minute();
      timeInSeconds = hours * 3600 + minutes * 60;
    }

    const submitData: CreateTrick = {
      name: values.name as string,
      time: timeInSeconds,
      staffIds: (values.staffIds as string[]) || [],
      jobIds: (values.jobIds as string[]) || [],
      countStaff: values.countStaff as number,
      description: values.description as string || "",
      status: values.status as TRICK_STATUS,
    };
    
    mutate(submitData);
  };

  const onReset = () => {
    form.resetFields();
  };

  // Tính tổng thời gian
  const totalTime = useMemo(() => {
    let trickTime = 0;
    let jobsTime = 0;

    // Tính thời gian của trick
    if (timeValue && dayjs.isDayjs(timeValue)) {
      const hours = timeValue.hour();
      const minutes = timeValue.minute();
      trickTime = hours * 3600 + minutes * 60;
    }

    // Tính tổng thời gian của các job đã chọn
    if (jobIds && Array.isArray(jobIds) && jobIds.length > 0 && jobList) {
      jobsTime = jobIds.reduce((sum, jobId) => {
        const job = jobList.find((j: { _id: string; time: number }) => j._id === jobId);
        return sum + (job?.time || 0);
      }, 0);
    }

    return trickTime + jobsTime;
  }, [timeValue, jobIds, jobList]);

  // Format thời gian để hiển thị
  const formatTimeDisplay = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours) {
      return `${hours.toString().padStart(2, "0")} giờ ${minutes.toString().padStart(2, "0")} phút`;
    } else {
      return `${minutes.toString().padStart(2, "0")} phút`;
    }
  };

  return (
    <div>
      <h2>Thêm mới thủ thuật</h2>

      <Flex justify="center">
        <div style={{ minWidth: 1000 }}>
          <Form form={form} onFinish={onFinish} layout="vertical">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Tên thủ thuật"
                  rules={[{ required: true, message: "Vui lòng nhập tên thủ thuật" }]}
                >
                  <Input placeholder="Nhập tên thủ thuật" />
                </Form.Item>

                <Form.Item
                  name="time"
                  label="Thời gian (giờ:phút)"
                  rules={[
                    { required: true, message: "Vui lòng chọn thời gian" },
                  ]}
                >
                  <TimePicker
                    format="HH:mm"
                    placeholder="Chọn thời gian"
                    style={{ width: "100%" }}
                  />
                </Form.Item>

                <Form.Item
                  name="staffIds"
                  label="Bác sĩ"
                  rules={[{ required: true, message: "Vui lòng chọn nhân viên" }]}
                >
                  <Select placeholder="Chọn nhân viên" mode="multiple">
                    {staffList?.map((staff: { _id: string; name: string; phone: string; role: string }) => (
                      <Option key={staff._id} value={staff._id}>
                        {staff.name} - {staff.phone} - {convertNameRole(staff.role)}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="countStaff"
                  label="Số lượng nhân viên"
                  rules={[
                    { required: true, message: "Vui lòng nhập số lượng nhân viên" },
                    { type: "number", min: 1, message: "Số lượng nhân viên phải lớn hơn 0" },
                  ]}
                >
                  <InputNumber
                    placeholder="Nhập số lượng nhân viên"
                    style={{ width: "100%" }}
                    min={1}
                  />
                </Form.Item>

                <Form.Item
                  name="jobIds"
                  label="Công việc"
                >
                  <Select
                    mode="multiple"
                    placeholder="Chọn công việc"
                    allowClear
                  >
                    {jobList?.map((job: { _id: string; name: string; time: number }) => (
                      <Option key={job._id} value={job._id}>
                        {job.name} - {formatTimeDisplay(job.time)}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="status"
                  initialValue={TRICK_STATUS.ACTIVE}
                  label="Trạng thái"
                  rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
                >
                  <Select placeholder="Chọn trạng thái">
                    <Option value={TRICK_STATUS.ACTIVE} key={TRICK_STATUS.ACTIVE} selected>Hoạt động</Option>
                    <Option value={TRICK_STATUS.DISABLED} key={TRICK_STATUS.DISABLED}>Không hoạt động</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row>
              <Col span={24}>
                <Form.Item
                  name="description"
                  label="Mô tả"
                >
                  <TextArea
                    placeholder="Nhập mô tả thủ thuật"
                    rows={4}
                  />
                </Form.Item>
              </Col>
            </Row>

            {(timeValue || (jobIds && jobIds.length > 0)) && (
              <Row>
                <Col span={24}>
                  <Alert
                    message={
                      <div style={{ fontWeight: "bold", fontSize: "16px" }}>
                        Tổng thời gian thực hiện: <span style={{ color: "#1890ff" }}>{formatTimeDisplay(totalTime)}</span>
                      </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                </Col>
              </Row>
            )}

            <Row justify="end">
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isPending}>
                    Thêm mới
                  </Button>
                  <Button onClick={onReset}>Reset</Button>
                </Space>
              </Form.Item>
            </Row>
          </Form>
        </div>
      </Flex>
    </div>
  );
}

export default TrickAdd;

