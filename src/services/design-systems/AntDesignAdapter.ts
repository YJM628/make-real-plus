/**
 * Ant Design System Adapter
 * Feature: ai-html-visual-editor
 * Requirements: 1.5, 1.7, 13.2, 13.4
 */

import {
  BaseDesignSystemAdapter,
  type ComponentSyntax,
  type DesignSystemConfig,
} from './DesignSystemAdapter';

/**
 * Ant Design System Adapter
 * 
 * Provides Ant Design component syntax and styling conventions
 * for AI-generated code.
 */
export class AntDesignAdapter extends BaseDesignSystemAdapter {
  /**
   * Get Ant Design configuration
   */
  getConfig(): DesignSystemConfig {
    return {
      name: 'Ant Design',
      version: '5.x',
      packages: ['antd'],
      stylesheets: [
        'https://cdn.jsdelivr.net/npm/antd@5/dist/reset.css',
      ],
      setup: `
// Import Ant Design components from 'antd'
// Import styles: import 'antd/dist/reset.css';
      `.trim(),
    };
  }

  /**
   * Get Ant Design component syntax examples
   */
  getComponentSyntax(): ComponentSyntax[] {
    return [
      {
        name: 'Button',
        example: '<Button type="primary">Click Me</Button>',
        props: ['type', 'size', 'shape', 'icon', 'loading', 'disabled', 'danger'],
        imports: ['import { Button } from "antd";'],
      },
      {
        name: 'Input',
        example: '<Input placeholder="Enter text" />',
        props: ['placeholder', 'size', 'prefix', 'suffix', 'disabled', 'allowClear'],
        imports: ['import { Input } from "antd";'],
      },
      {
        name: 'Card',
        example: `<Card title="Card Title" bordered={false}>
  <p>Card content</p>
</Card>`,
        props: ['title', 'bordered', 'hoverable', 'loading', 'size', 'extra'],
        imports: ['import { Card } from "antd";'],
      },
      {
        name: 'Form',
        example: `<Form layout="vertical">
  <Form.Item label="Username" name="username" rules={[{ required: true }]}>
    <Input />
  </Form.Item>
  <Form.Item>
    <Button type="primary" htmlType="submit">Submit</Button>
  </Form.Item>
</Form>`,
        props: ['layout', 'onFinish', 'form', 'initialValues'],
        imports: ['import { Form, Input, Button } from "antd";'],
      },
      {
        name: 'Table',
        example: '<Table dataSource={data} columns={columns} />',
        props: ['dataSource', 'columns', 'pagination', 'loading', 'rowKey'],
        imports: ['import { Table } from "antd";'],
      },
      {
        name: 'Layout',
        example: `<Layout>
  <Header>Header</Header>
  <Content>Content</Content>
  <Footer>Footer</Footer>
</Layout>`,
        props: ['className', 'style'],
        imports: ['import { Layout } from "antd";', 'const { Header, Content, Footer } = Layout;'],
      },
      {
        name: 'Menu',
        example: `<Menu mode="horizontal" defaultSelectedKeys={['1']}>
  <Menu.Item key="1">Home</Menu.Item>
  <Menu.Item key="2">About</Menu.Item>
</Menu>`,
        props: ['mode', 'theme', 'defaultSelectedKeys', 'items'],
        imports: ['import { Menu } from "antd";'],
      },
      {
        name: 'Modal',
        example: `<Modal title="Modal Title" open={open} onOk={handleOk} onCancel={handleCancel}>
  <p>Modal content</p>
</Modal>`,
        props: ['title', 'open', 'onOk', 'onCancel', 'footer', 'width'],
        imports: ['import { Modal } from "antd";'],
      },
      {
        name: 'Space',
        example: `<Space>
  <Button>Button 1</Button>
  <Button>Button 2</Button>
</Space>`,
        props: ['direction', 'size', 'align', 'wrap'],
        imports: ['import { Space } from "antd";'],
      },
      {
        name: 'Row & Col',
        example: `<Row gutter={16}>
  <Col span={12}>Column 1</Col>
  <Col span={12}>Column 2</Col>
</Row>`,
        props: ['gutter', 'span', 'offset', 'xs', 'sm', 'md', 'lg', 'xl'],
        imports: ['import { Row, Col } from "antd";'],
      },
    ];
  }

  /**
   * Generate AI prompt instructions for Ant Design
   */
  getPromptInstructions(): string {
    return `
Use Ant Design components for this design. Follow these guidelines:

1. **Component Usage**:
   - Use Ant Design components like Button, Input, Card, Form, Table, Layout
   - Import components from 'antd'
   - Example: import { Button, Input, Card } from 'antd';

2. **Styling**:
   - Use the 'type' prop for button variations (primary, default, dashed, text, link)
   - Use the 'size' prop for component sizes (small, middle, large)
   - Use inline styles or CSS classes for custom styling
   - Ant Design uses a 24-column grid system

3. **Layout**:
   - Use Layout component with Header, Content, Footer, Sider
   - Use Row and Col for grid layouts (24-column system)
   - Use Space for spacing between elements
   - Grid breakpoints: xs (<576px), sm (≥576px), md (≥768px), lg (≥992px), xl (≥1200px), xxl (≥1600px)

4. **Forms**:
   - Use Form component with Form.Item for form structure
   - Use Input, Select, Checkbox, Radio, DatePicker for form controls
   - Add validation rules in Form.Item
   - Example: <Form.Item name="email" rules={[{ required: true, type: 'email' }]}>

5. **Data Display**:
   - Use Table for data tables with columns and dataSource props
   - Use List for lists with List.Item
   - Use Descriptions for key-value pairs
   - Use Card for content containers

6. **Navigation**:
   - Use Menu for navigation menus (horizontal or vertical)
   - Use Breadcrumb for breadcrumb navigation
   - Use Tabs for tabbed interfaces
   - Use Pagination for page navigation

7. **Feedback**:
   - Use Modal for dialogs
   - Use message for toast notifications
   - Use notification for notification messages
   - Use Alert for alert messages

8. **Icons**:
   - Import icons from @ant-design/icons
   - Example: import { MenuOutlined, UserOutlined } from '@ant-design/icons';
   - Use as standalone or with icon prop in components

9. **Best Practices**:
   - Use Form.useForm() hook for form control
   - Add proper keys to list items
   - Use ConfigProvider for global configuration
   - Follow Ant Design's design principles

Example structure:
\`\`\`jsx
<Layout>
  <Header>
    <Menu mode="horizontal" defaultSelectedKeys={['1']}>
      <Menu.Item key="1">Home</Menu.Item>
      <Menu.Item key="2">About</Menu.Item>
    </Menu>
  </Header>
  <Content style={{ padding: '24px' }}>
    <Row gutter={16}>
      <Col span={12}>
        <Card title="Card Title" bordered={false}>
          <Form layout="vertical">
            <Form.Item label="Name" name="name" rules={[{ required: true }]}>
              <Input placeholder="Enter name" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">Submit</Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  </Content>
</Layout>
\`\`\`

Generate clean, production-ready Ant Design code following these conventions.
    `.trim();
  }

  /**
   * Validate Ant Design syntax
   */
  validateSyntax(html: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const result = super.validateSyntax(html);

    // Check for Ant Design-specific components
    const antdComponents = [
      'Button',
      'Input',
      'Card',
      'Form',
      'Table',
      'Layout',
      'Menu',
      'Space',
      'Row',
      'Col',
    ];

    let hasAntdComponents = false;
    for (const component of antdComponents) {
      if (this.containsComponent(html, component)) {
        hasAntdComponents = true;
        break;
      }
    }

    if (!hasAntdComponents) {
      result.warnings.push(
        'No Ant Design components detected. Consider using Ant Design components like Button, Input, Card, etc.'
      );
    }

    // Check for common mistakes
    if (html.includes('class=') && !html.includes('className=')) {
      result.warnings.push(
        'Using "class" instead of "className". Ant Design uses React/JSX syntax.'
      );
    }

    // Check for Form without Form.Item
    if (this.containsComponent(html, 'Form') && !html.includes('Form.Item')) {
      result.warnings.push(
        'Form component should contain Form.Item components for proper structure.'
      );
    }

    // Check for Table without dataSource
    if (this.containsComponent(html, 'Table') && !html.includes('dataSource')) {
      result.warnings.push(
        'Table component requires dataSource prop.'
      );
    }

    return result;
  }

  /**
   * Get required imports for Ant Design components
   */
  getRequiredImports(html: string): {
    imports: string[];
    cdnLinks: string[];
  } {
    const imports: string[] = [];
    const cdnLinks: string[] = [];

    // Detect which components are used
    const components = [
      'Button',
      'Input',
      'Card',
      'Form',
      'Table',
      'Layout',
      'Menu',
      'Modal',
      'Space',
      'Row',
      'Col',
      'Select',
      'Checkbox',
      'Radio',
      'DatePicker',
      'List',
      'Tabs',
      'Breadcrumb',
      'Pagination',
      'Alert',
    ];

    const usedComponents: string[] = [];
    for (const component of components) {
      if (this.containsComponent(html, component)) {
        usedComponents.push(component);
      }
    }

    if (usedComponents.length > 0) {
      imports.push(`import { ${usedComponents.join(', ')} } from 'antd';`);
    }

    // Add CDN links for styles
    const config = this.getConfig();
    cdnLinks.push(...(config.stylesheets || []));

    return { imports, cdnLinks };
  }
}
