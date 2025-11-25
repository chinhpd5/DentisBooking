import {
  Button,
  Col,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Toast from "react-hot-toast";
import { useEffect } from "react";
import { getCustomerById, updateCustomer } from "../../services/customer";
import ICustomer, { CreateCustomer } from "../../types/customer";

const { Option } = Select;

function CustomerEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: customer, isLoading } = useQuery<ICustomer>({
    queryKey: ["customer", id],
    queryFn: () => getCustomerById(id!),
    enabled: !!id,
  });

  // Update form when customer data is loaded
  useEffect(() => {
    if (customer) {
      form.setFieldsValue({
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        gender: customer.gender,
        note: customer.note,
        yearOfBirth: customer.yearOfBirth,
      });
    }
  }, [customer, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCustomer> }) =>
      updateCustomer(id, data),
    onSuccess: () => {
      Toast.success("Cập nhật khách hàng thành công");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      navigate("/customer");
    },
    // onError: (error: { response?: { data?: { message?: string } } }) => {
    //   Toast.error("Cập nhật thất bại: " + error?.response?.data?.message);
    // },
  });

  const onFinish = (values: Partial<CreateCustomer> & { yearOfBirth?: number | null }) => {
    if (id) {
      const submitData: Record<string, unknown> = {};
      if (values.name) submitData.name = values.name;
      if (values.phone) submitData.phone = values.phone;
      if (values.address) submitData.address = values.address;
      if (values.gender) submitData.gender = values.gender;
      if (values.note !== undefined) submitData.note = values.note;
      // Allow clearing yearOfBirth by sending null/undefined
      if (values.yearOfBirth !== undefined) {
        submitData.yearOfBirth = values.yearOfBirth ?? null;
      }
      mutate({ id, data: submitData as Partial<CreateCustomer> });
    }
  };

  if (isLoading) return <Spin />;

  return (
    <div>
      <h2>Cập nhật khách hàng</h2>
      <Flex justify="center">
        <div style={{ width: "100%", maxWidth: 1200, padding: "0 16px" }}>
          <Form form={form} onFinish={onFinish} layout="vertical">
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Tên khách hàng"
                  rules={[
                    { required: true, message: "Vui lòng nhập tên khách hàng" },
                    { min: 1, message: "Tên khách hàng phải có ít nhất 1 ký tự" },
                    { max: 200, message: "Tên khách hàng tối đa 200 ký tự" },
                  ]}
                >
                  <Input placeholder="Nhập tên khách hàng" />
                </Form.Item>

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
                  <Input placeholder="Nhập số điện thoại" maxLength={10} />
                </Form.Item>
                <Form.Item
                  name="gender"
                  label="Giới tính"
                >
                  <Select placeholder="Chọn giới tính">
                    <Option value="male">Nam</Option>
                    <Option value="female">Nữ</Option>
                    <Option value="other">Khác</Option>
                  </Select>
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
                  name="yearOfBirth"
                  label="Năm sinh"
                  rules={[
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        const currentYear = new Date().getFullYear();
                        if (value < 1900 || value > currentYear - 1) {
                          return Promise.reject(new Error("Năm sinh phải lớn hơn 1 tuổi và hợp lệ"));
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
                    max={new Date().getFullYear() - 1}
                  />
                </Form.Item>

              </Col>
            </Row>

            <Row>
              <Col span={24}>
                <Form.Item
                  name="note"
                  label="Ghi chú"
                  rules={[
                    { max: 500, message: "Ghi chú tối đa 500 ký tự" },
                  ]}
                >
                  <Input.TextArea
                    placeholder="Nhập ghi chú (nếu có)"
                    rows={3}
                    maxLength={500}
                    showCount
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

export default CustomerEdit;

