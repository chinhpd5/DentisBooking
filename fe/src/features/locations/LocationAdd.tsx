import { Button, Col, Flex, Form, Input, Row, Space } from "antd";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Toast from "react-hot-toast";
import { CreateLocation } from "../../types/location";
import { addLocation } from "../../services/location";

function LocationAdd() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateLocation) => addLocation(data),
    onSuccess: () => {
      Toast.success("Thêm tầng thành công");
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      form.resetFields();
      navigate("/location");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      Toast.error("Thêm tầng thất bại: " + (error.response?.data?.message || "Lỗi không xác định"));
    },
  });

  const onFinish = (values: CreateLocation) => {
    mutate(values);
  };

  const onReset = () => {
    form.resetFields();
  };

  return (
    <div>
      <h2>Thêm mới tầng</h2>

      <Flex justify="center">
        <div style={{ minWidth: 1000 }}>
          <Form form={form} onFinish={onFinish} layout="vertical">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Tên tầng"
                  rules={[{ required: true, message: "Vui lòng nhập tên tầng" }]}
                >
                  <Input placeholder="Nhập tên tầng" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="description"
                  label="Mô tả"
                >
                  <Input.TextArea rows={4} placeholder="Nhập mô tả (không bắt buộc)" />
                </Form.Item>
              </Col>
            </Row>

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

export default LocationAdd;

