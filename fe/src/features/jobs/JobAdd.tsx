import { Button, Col, Flex, Form, Input, Row, Select, Space, Switch, TimePicker } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Toast from "react-hot-toast";
import { CreateJob } from "../../types/job";
import { JOB_STATUS } from "../../contants";
import { addJob } from "../../services/job";
import dayjs from "dayjs";
import { ArrowLeftOutlined } from "@ant-design/icons";
const { Option } = Select;
const { TextArea } = Input;

function JobAdd() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateJob) => addJob(data),
    onSuccess: () => {
      Toast.success("Thêm mới công việc thành công");
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      form.resetFields();
      navigate("/job");
    },
    // onError: (err: unknown) => {
    //   const error = err as { response?: { data?: { message?: string } } };
    //   Toast.error("Thêm mới công việc thất bại: " + (error.response?.data?.message || "Lỗi không xác định"));
    // },
  });

  const onFinish = (values: Record<string, unknown>) => {
    // Chuyển đổi thời gian từ HH:mm sang giây
    let timeInSeconds = 0;
    if (values.time && dayjs.isDayjs(values.time)) {
      const hours = values.time.hour();
      const minutes = values.time.minute();
      timeInSeconds = hours * 3600 + minutes * 60;
    }

    const submitData: CreateJob = {
      name: values.name as string,
      time: timeInSeconds,
      isFirst: (values.isFirst as boolean) ?? false,
      description: (values.description as string) ?? "",
      status: values.status as JOB_STATUS,
    };
    
    mutate(submitData);
  };

  const onReset = () => {
    form.resetFields();
  };

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Thêm mới công việc KTV</h2>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/job")}>
          Quay lại
        </Button>
      </Flex>

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
                  initialValue={false}
                >
                  <Switch checkedChildren="Có" unCheckedChildren="Không" />
                </Form.Item>

                <Form.Item
                  name="status"
                  label="Trạng thái"
                  initialValue={JOB_STATUS.ACTIVE}
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
                    Thêm mới
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

export default JobAdd;

