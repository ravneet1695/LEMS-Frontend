#!/bin/bash
# Script to add SweetAlert import to all files that use confirm()

files=(
    "src/app/modules/admin/users/user-management.component.ts"
    "src/app/modules/super-admin/organization-users/organization-users.component.ts"
    "src/app/modules/test-admin/question-bank/question-bank.component.ts"
    "src/app/modules/super-admin/settings/global-settings.component.ts"
    "src/app/modules/super-admin/organizations/organization-management.component.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        # Check if SweetAlert import already exists
        if ! grep -q "SweetAlertService" "$file"; then
            # Add import after the last import statement
            sed -i '' "/^import.*from/a\\
import { SweetAlertService } from '../../../core/services/sweetalert.service';
" "$file"
            echo "Added SweetAlert import to $file"
        fi
    fi
done

echo "Done!"
