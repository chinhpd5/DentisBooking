import { Button, Col, Flex, Form, Input, InputNumber, Row, Select, Space, Spin, TimePicker } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import Toast from "react-hot-toast";
import { CreateTrick } from "../../types/trick";
import ITrick from "../../types/trick";
import { TRICK_STATUS, JOB_STATUS, USER_ROLE } from "../../contants";
import { getTrickById, updateTrick } from "../../services/trick";
import { getAllStaff } from "../../services/staff";
import { getListJob } from "../../services/job";
import dayjs from "dayjs";
import { convertNameRole } from "../../utils/helper";
import { IStaff } from "../../types/staff";

const { Option } = Select;
const { TextArea } = Input;

function TrickEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ITrick>({
    queryKey: ["trick", id],
    placeholderData: (prev) => prev,
    queryFn: () => getTrickById(id!),
    enabled: !!id,
  });

  const { data: staffList } = useQuery({
    queryKey: ["staffs", 1, 100],
    queryFn: () => getAllStaff(USER_ROLE.DOCTOR),
  });

  const { data: jobList } = useQuery({
    queryKey: ["jobs", 1, 100],
    queryFn: () => getListJob(1, 100, undefined, JOB_STATUS.ACTIVE),
  });

  useEffect(() => {
    if (data) {
      // Chuyển đổi thời gian từ giây sang dayjs object cho TimePicker
      const timeInSeconds = data.time;
      const hours = Math.floor(timeInSeconds / 3600);
      const minutes = Math.floor((timeInSeconds % 3600) / 60);
      const timeValue = dayjs().hour(hours).minute(minutes).second(0);

      // Xử lý jobIds - chuyển từ object array sang string array
      const jobIds = Array.isArray(data.jobIds)
        ? data.jobIds.map((job) => (typeof job === 'object' ? job._id : job))
        : [];

      // Xử lý staffId - chuyển từ object sang string nếu cần
      const staffIds = Array.isArray(data.staffIds) ? data.staffIds.map((staff) => (typeof staff === 'object' ? staff._id : staff)) : [];

      form.setFieldsValue({
        ...data,
        time: timeValue,
        jobIds: jobIds,
        staffIds: staffIds,
      });
    }
  }, [data, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTrick> }) =>
      updateTrick(id, data),
    onSuccess: () => {
      Toast.success("Cập nhật thủ thuật thành công");
      queryClient.invalidateQueries({ queryKey: ["tricks"] });
      navigate("/trick");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      Toast.error("Cập nhật thủ thuật thất bại: " + (error.response?.data?.message || "Lỗi không xác định"));
    },
  });

  const onFinish = (values: Record<string, unknown>) => {
    if (id) {
      // Chuyển đổi thời gian từ HH:mm sang giây
      let timeInSeconds = 0;
      if (values.time && dayjs.isDayjs(values.time)) {
        const hours = values.time.hour();
        const minutes = values.time.minute();
        timeInSeconds = hours * 3600 + minutes * 60;
      }

      const submitData: Partial<CreateTrick> = {
        name: values.name as string,
        time: timeInSeconds,
        staffIds: (values.staffIds as string[]) || [],
        jobIds: (values.jobIds as string[]) || [],
        countStaff: values.countStaff as number,
        description: values.description as string || "",
        status: values.status as TRICK_STATUS,
      };

      mutate({ id, data: submitData });
    }
  };

  const onReset = () => {
    form.resetFields();
  };

  if (isLoading) {
    return <Spin />;
  }

  return (
    <div>
      <h2>Cập nhật thủ thuật</h2>

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
                  label="Thời gian"
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
                  label="Nhân viên"
                  rules={[{ required: true, message: "Vui lòng chọn nhân viên" }]}
                >
                  <Select placeholder="Chọn nhân viên" mode="multiple">
                    {staffList?.map((staff: IStaff) => (
                      <Option key={staff._id} value={staff._id}>
                        {staff.name} - {convertNameRole(staff.role)}
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
                    {jobList?.data?.map((job: { _id: string; name: string }) => (
                      <Option key={job._id} value={job._id}>
                        {job.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
                >
                  <Select placeholder="Chọn trạng thái">
                    <Option value={TRICK_STATUS.ACTIVE}>Hoạt động</Option>
                    <Option value={TRICK_STATUS.DISABLED}>Không hoạt động</Option>
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

            <Row justify="end">
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isPending}>
                    Cập nhật
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

export default TrickEdit;

