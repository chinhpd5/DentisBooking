import {
  Button,
  Col,
  Flex,
  Form,
  Input,
  Row,
  Space,
  Spin,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Toast from "react-hot-toast";
import { getLocationById, updateLocation } from "../../services/location";
import ILocation, { CreateLocation } from "../../types/location";

function LocationEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: location, isLoading } = useQuery<ILocation>({
    queryKey: ["location", id],
    queryFn: () => getLocationById(id!),
    enabled: !!id,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateLocation> }) =>
      updateLocation(id, data),
    onSuccess: () => {
      Toast.success("Cập nhật tầng thành công");
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      navigate("/location");
    },
    // onError: (error: unknown) => {
    //   const err = error as { response?: { data?: { message?: string } } };
    //   Toast.error("Cập nhật thất bại: " + (err.response?.data?.message || "Lỗi không xác định"));
    // },
  });

  const onFinish = (values: Partial<CreateLocation>) => {
    if (id) {
      mutate({ id, data: values });
    }
  };

  if (isLoading) return <Spin />;

  return (
    <div>
      <h2>Cập nhật tầng</h2>
      <Flex justify="center">
        <div style={{ width: "100%", maxWidth: 1200, padding: "0 16px" }}>
          <Form form={form} onFinish={onFinish} initialValues={location}>
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
                  <Input.TextArea rows={4} placeholder="Nhập mô tả" />
                </Form.Item>
              </Col>
            </Row>

            <Row justify="start">
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isPending}>
                    Cập nhật
                  </Button>
                  <Button htmlType="button" onClick={() => form.resetFields()}>
                    Nhập lại
                  </Button>
                </Space>
              </Form.Item>
            </Row>
          </Form>
        </div>
      </Flex>
    </div>
  );
}

export default LocationEdit;

