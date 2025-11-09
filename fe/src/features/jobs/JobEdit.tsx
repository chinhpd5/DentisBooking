      import { Button, Col, Flex, Form, Input, Row, Select, Space, Spin, Switch, TimePicker } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import Toast from "react-hot-toast";
import { CreateJob } from "../../types/job";
import IJob from "../../types/job";
import { JOB_STATUS } from "../../contants";
import { getJobById, updateJob } from "../../services/job";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

function JobEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<IJob>({
    queryKey: ["job", id],
    placeholderData: (prev) => prev,
    queryFn: () => getJobById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (data) {
      // Chuyển đổi thời gian từ giây sang dayjs object cho TimePicker
      const timeInSeconds = data.time;
      const hours = Math.floor(timeInSeconds / 3600);
      const minutes = Math.floor((timeInSeconds % 3600) / 60);
      const timeValue = dayjs().hour(hours).minute(minutes).second(0);

      form.setFieldsValue({
        ...data,
        time: timeValue,
      });
    }
  }, [data, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateJob> }) =>
      updateJob(id, data),
    onSuccess: () => {
      Toast.success("Cập nhật công việc thành công");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      navigate("/job");
    },
    // onError: (err: unknown) => {
    //   const error = err as { response?: { data?: { message?: string } } };
    //   Toast.error("Cập nhật công việc thất bại: " + (error.response?.data?.message || "Lỗi không xác định"));
    // },
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

      const submitData: Partial<CreateJob> = {
        name: values.name as string,
        time: timeInSeconds,
        isFirst: values.isFirst as boolean,
        description: values.description as string,
        status: values.status as JOB_STATUS,
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
      <h2>Cập nhật công việc KTV</h2>

      <Flex justify="center">
        <div style={{ width: "100%", maxWidth: 1200, padding: "0 16px" }}>
          <Form form={form} onFinish={onFinish} layout="vertical">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Tên công việc chuẩn bị"
                  rules={[{ required: true, message: "Vui lòng nhập tên công việc chuẩn bị" }]}
                >
                  <Input placeholder="Nhập tên công việc" />
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
              </Col>

              <Col span={12}>
                <Form.Item
                  name="isFirst"
                  label="Công việc này được thực hiện trước thủ thuật"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Có" unCheckedChildren="Không" />
                </Form.Item>

                <Form.Item
                  name="status"
                  label="Trạng thái"
                  rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
                >
                  <Select placeholder="Chọn trạng thái">
                    <Option value={JOB_STATUS.ACTIVE}>Hoạt động</Option>
                    <Option value={JOB_STATUS.DISABLED}>Không hoạt động</Option>
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
                    placeholder="Nhập mô tả công việc"
                    rows={4}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row justify="start">
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isPending}>
                    Cập nhật
                  </Button>
                  <Button onClick={onReset}>Nhập lại</Button>
                </Space>
              </Form.Item>
            </Row>
          </Form>
        </div>
      </Flex>
    </div>
  );
}

export default JobEdit;

