/**
 * Material UI Design System Adapter
 * Feature: ai-html-visual-editor
 * Requirements: 1.5, 1.7, 13.1, 13.4
 */

import {
  BaseDesignSystemAdapter,
  type ComponentSyntax,
  type DesignSystemConfig,
} from './DesignSystemAdapter';

/**
 * Material UI (MUI) Design System Adapter
 * 
 * Provides Material UI component syntax and styling conventions
 * for AI-generated code.
 */
export class MaterialUIAdapter extends BaseDesignSystemAdapter {
  /**
   * Get Material UI configuration
   */
  getConfig(): DesignSystemConfig {
    return {
      name: 'Material UI',
      version: '5.x',
      packages: [
        '@mui/material',
        '@mui/icons-material',
        '@emotion/react',
        '@emotion/styled',
      ],
      stylesheets: [
        'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap',
        'https://fonts.googleapis.com/icon?family=Material+Icons',
      ],
      setup: `
// Material UI uses Emotion for styling
// Import components from @mui/material
// Import icons from @mui/icons-material
      `.trim(),
    };
  }

  /**
   * Get Material UI component syntax examples
   */
  getComponentSyntax(): ComponentSyntax[] {
    return [
      {
        name: 'Button',
        example: '<Button variant="contained" color="primary">Click Me</Button>',
        props: ['variant', 'color', 'size', 'disabled', 'startIcon', 'endIcon'],
        imports: ['import { Button } from "@mui/material";'],
      },
      {
        name: 'TextField',
        example: '<TextField label="Email" variant="outlined" fullWidth />',
        props: ['label', 'variant', 'type', 'fullWidth', 'required', 'error', 'helperText'],
        imports: ['import { TextField } from "@mui/material";'],
      },
      {
        name: 'Card',
        example: `<Card>
  <CardContent>
    <Typography variant="h5">Title</Typography>
    <Typography variant="body2">Content</Typography>
  </CardContent>
</Card>`,
        props: ['elevation', 'variant'],
        imports: [
          'import { Card, CardContent } from "@mui/material";',
          'import { Typography } from "@mui/material";',
        ],
      },
      {
        name: 'AppBar',
        example: `<AppBar position="static">
  <Toolbar>
    <Typography variant="h6">App Title</Typography>
  </Toolbar>
</AppBar>`,
        props: ['position', 'color'],
        imports: [
          'import { AppBar, Toolbar } from "@mui/material";',
          'import { Typography } from "@mui/material";',
        ],
      },
      {
        name: 'Grid',
        example: `<Grid container spacing={2}>
  <Grid item xs={12} sm={6}>
    <Paper>Item 1</Paper>
  </Grid>
  <Grid item xs={12} sm={6}>
    <Paper>Item 2</Paper>
  </Grid>
</Grid>`,
        props: ['container', 'item', 'xs', 'sm', 'md', 'lg', 'xl', 'spacing'],
        imports: ['import { Grid, Paper } from "@mui/material";'],
      },
      {
        name: 'Typography',
        example: '<Typography variant="h4" component="h1">Heading</Typography>',
        props: ['variant', 'component', 'color', 'align', 'gutterBottom'],
        imports: ['import { Typography } from "@mui/material";'],
      },
      {
        name: 'IconButton',
        example: `<IconButton color="primary">
  <MenuIcon />
</IconButton>`,
        props: ['color', 'size', 'disabled'],
        imports: [
          'import { IconButton } from "@mui/material";',
          'import MenuIcon from "@mui/icons-material/Menu";',
        ],
      },
      {
        name: 'Dialog',
        example: `<Dialog open={open} onClose={handleClose}>
  <DialogTitle>Title</DialogTitle>
  <DialogContent>
    <DialogContentText>Content</DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button onClick={handleClose}>OK</Button>
  </DialogActions>
</Dialog>`,
        props: ['open', 'onClose', 'maxWidth', 'fullWidth'],
        imports: [
          'import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";',
        ],
      },
    ];
  }

  /**
   * Generate AI prompt instructions for Material UI
   */
  getPromptInstructions(): string {
    return `
Use Material UI (MUI) components for this design. Follow these guidelines:

1. **Component Usage**:
   - Use MUI components like Button, TextField, Card, AppBar, Grid, Typography
   - Import components from @mui/material
   - Import icons from @mui/icons-material

2. **Styling**:
   - Use the 'variant' prop for component variations (e.g., Button variant="contained")
   - Use the 'color' prop for theming (primary, secondary, error, warning, info, success)
   - Use the sx prop for custom inline styles: sx={{ margin: 2, padding: 1 }}
   - Use Material UI's spacing system (1 unit = 8px)

3. **Layout**:
   - Use Grid component for responsive layouts
   - Use Container for page-level layout
   - Use Box for flexible containers with sx prop
   - Grid breakpoints: xs (0px), sm (600px), md (900px), lg (1200px), xl (1536px)

4. **Typography**:
   - Use Typography component for all text
   - Variants: h1-h6, subtitle1-2, body1-2, button, caption, overline
   - Example: <Typography variant="h4" component="h1">Title</Typography>

5. **Forms**:
   - Use TextField for inputs
   - Use FormControl, FormLabel, FormHelperText for form structure
   - Use Select, Checkbox, Radio, Switch for form controls

6. **Common Patterns**:
   - Cards: Use Card with CardContent, CardActions, CardMedia
   - Navigation: Use AppBar with Toolbar
   - Lists: Use List with ListItem, ListItemText, ListItemIcon
   - Dialogs: Use Dialog with DialogTitle, DialogContent, DialogActions

7. **Icons**:
   - Import icons from @mui/icons-material
   - Example: import MenuIcon from '@mui/icons-material/Menu'
   - Use with IconButton or as startIcon/endIcon in Button

8. **Best Practices**:
   - Always use semantic HTML with MUI components
   - Add proper ARIA labels for accessibility
   - Use fullWidth prop for responsive inputs
   - Use elevation prop for Card depth (0-24)

Example structure:
\`\`\`jsx
<Container maxWidth="lg">
  <AppBar position="static">
    <Toolbar>
      <Typography variant="h6">App Title</Typography>
    </Toolbar>
  </AppBar>
  <Grid container spacing={3} sx={{ mt: 2 }}>
    <Grid item xs={12} md={6}>
      <Card>
        <CardContent>
          <Typography variant="h5">Card Title</Typography>
          <Typography variant="body2">Card content</Typography>
        </CardContent>
        <CardActions>
          <Button size="small" color="primary">Learn More</Button>
        </CardActions>
      </Card>
    </Grid>
  </Grid>
</Container>
\`\`\`

Generate clean, production-ready Material UI code following these conventions.
    `.trim();
  }

  /**
   * Validate Material UI syntax
   */
  validateSyntax(html: string): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const result = super.validateSyntax(html);

    // Check for MUI-specific components
    const muiComponents = [
      'Button',
      'TextField',
      'Card',
      'Typography',
      'Grid',
      'AppBar',
      'Container',
      'Box',
    ];

    let hasMuiComponents = false;
    for (const component of muiComponents) {
      if (this.containsComponent(html, component)) {
        hasMuiComponents = true;
        break;
      }
    }

    if (!hasMuiComponents) {
      result.warnings.push(
        'No Material UI components detected. Consider using MUI components like Button, TextField, Card, etc.'
      );
    }

    // Check for common mistakes
    if (html.includes('class=') && !html.includes('className=')) {
      result.warnings.push(
        'Using "class" instead of "className". Material UI uses React/JSX syntax.'
      );
    }

    // Check for inline styles without sx prop
    if (html.includes('style=') && !html.includes('sx=')) {
      result.warnings.push(
        'Consider using the sx prop instead of inline styles for better Material UI integration.'
      );
    }

    return result;
  }

  /**
   * Get required imports for Material UI components
   */
  getRequiredImports(html: string): {
    imports: string[];
    cdnLinks: string[];
  } {
    const imports: string[] = [];
    const cdnLinks: string[] = [];

    // Detect which components are used
    const componentMap: Record<string, string> = {
      Button: '@mui/material',
      TextField: '@mui/material',
      Card: '@mui/material',
      CardContent: '@mui/material',
      CardActions: '@mui/material',
      Typography: '@mui/material',
      Grid: '@mui/material',
      AppBar: '@mui/material',
      Toolbar: '@mui/material',
      Container: '@mui/material',
      Box: '@mui/material',
      Paper: '@mui/material',
      IconButton: '@mui/material',
      Dialog: '@mui/material',
      DialogTitle: '@mui/material',
      DialogContent: '@mui/material',
      DialogActions: '@mui/material',
    };

    const usedComponents: string[] = [];
    for (const [component, pkg] of Object.entries(componentMap)) {
      if (this.containsComponent(html, component)) {
        usedComponents.push(component);
      }
    }

    if (usedComponents.length > 0) {
      imports.push(
        `import { ${usedComponents.join(', ')} } from '@mui/material';`
      );
    }

    // Add CDN links for fonts
    const config = this.getConfig();
    cdnLinks.push(...(config.stylesheets || []));

    return { imports, cdnLinks };
  }
}
