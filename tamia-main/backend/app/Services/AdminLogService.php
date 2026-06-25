<?php

namespace App\Services;

use App\Models\AdminLog;

class AdminLogService
{
    public static function log($action, $targetType = null, $targetId = null, $details = null)
    {
        if (auth()->check()) {
            AdminLog::create([
                'admin_id' => auth()->id(),
                'action' => $action,
                'target_type' => $targetType,
                'target_id' => $targetId,
                'details' => $details,
            ]);
        }
    }
}
